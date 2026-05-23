export interface SentryAdapter {
  captureException(err: Error): unknown;
}

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, err?: unknown): void;
}

export function createLogger(sentry: SentryAdapter): Logger {
  return {
    info(message, context) {
      console.log(message, ...(context ? [context] : []));
    },
    warn(message, context) {
      console.warn(message, ...(context ? [context] : []));
    },
    error(message, err) {
      console.error(message, err ?? "");
      sentry.captureException(
        err instanceof Error ? err : new Error(err !== undefined ? String(err) : message),
      );
    },
  };
}
