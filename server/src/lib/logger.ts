import * as Sentry from "@sentry/node";

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    console.log(message, ...(context ? [context] : []));
  },
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(message, ...(context ? [context] : []));
  },
  error(message: string, err?: unknown): void {
    console.error(message, err ?? "");
    if (err !== undefined) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    } else {
      Sentry.captureMessage(message, "error");
    }
  },
};
