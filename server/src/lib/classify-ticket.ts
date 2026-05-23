import * as Sentry from "@sentry/node";
import { generateText } from "ai";
import { model } from "./ai";
import { prisma } from "./prisma";
import { boss } from "./queue";
import { Ticket, TicketCategory } from "../generated/prisma";

export const CLASSIFY_TICKET_JOB = "classify-ticket";

export interface ClassifyTicketPayload {
  id: number;
  subject: string;
  body: string;
}

const VALID_CATEGORIES = Object.values(TicketCategory);

const SYSTEM_PROMPT = `You are a support ticket classifier. Classify the support ticket into exactly one of these categories:
                        - general_questions: General inquiries, account questions, how-to questions
                        - technical_questions: Technical issues, bugs, errors, integration problems
                        - refund: Refund requests, billing disputes, cancellation requests

                        Respond with ONLY the category name, nothing else.`;

export async function classifyTicket(
  ticket: Pick<Ticket, "id" | "subject"> & { body: string },
): Promise<void> {
  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Subject: ${ticket.subject}\n\n${ticket.body}`,
    maxRetries: 0,
  });

  const category = text.trim().toLowerCase() as TicketCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Unexpected category from LLM: ${text.trim()} for ticket ${ticket.id}`,
    );
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { category },
  });
}

export async function registerClassifyTicketWorker(): Promise<void> {
  await boss.createQueue(CLASSIFY_TICKET_JOB, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });
  await boss.work<ClassifyTicketPayload>(
    CLASSIFY_TICKET_JOB,
    async (jobs) => {
      for (const job of jobs) {
        try {
          await classifyTicket(job.data);
        } catch (err) {
          Sentry.captureException(err);
          throw err;
        }
      }
    },
  );
}

