import * as Sentry from "@sentry/node";
import { createLogger } from "@helpdesk/core";

export const logger = createLogger(Sentry);
