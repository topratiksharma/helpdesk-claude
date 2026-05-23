import * as Sentry from "@sentry/node";
import { boss } from "./queue";
import { sendEmail } from "./email";

export const SEND_REPLY_EMAIL_JOB = "send-reply-email";

export interface SendReplyEmailPayload {
  to: string;
  toName: string;
  subject: string;
  body: string;
  html?: string;
}

export async function registerSendReplyEmailWorker(): Promise<void> {
  await boss.createQueue(SEND_REPLY_EMAIL_JOB, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });
  await boss.work<SendReplyEmailPayload>(SEND_REPLY_EMAIL_JOB, async (jobs) => {
    for (const job of jobs) {
      try {
        await sendEmail({
          to: job.data.to,
          toName: job.data.toName,
          subject: job.data.subject,
          body: job.data.body,
          html: job.data.html,
        });
      } catch (err) {
        Sentry.captureException(err);
        throw err;
      }
    }
  });
}
