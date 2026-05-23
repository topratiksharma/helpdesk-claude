import * as Sentry from "@sentry/react";
import { createLogger } from "@helpdesk/core";

export const logger = createLogger(Sentry);
