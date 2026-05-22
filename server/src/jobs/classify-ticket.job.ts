import { boss } from "../lib/boss";
import { classifyTicket } from "../lib/classify-ticket";

export const CLASSIFY_TICKET_JOB = "classify-ticket";

export interface ClassifyTicketPayload {
  id: number;
  subject: string;
  body: string;
}

export async function registerClassifyTicketWorker() {
  await boss.createQueue(CLASSIFY_TICKET_JOB);
  await boss.work<ClassifyTicketPayload>(
    CLASSIFY_TICKET_JOB,
    async (jobs) => {
      for (const job of jobs) {
        await classifyTicket(job.data);
      }
    },
  );
}
