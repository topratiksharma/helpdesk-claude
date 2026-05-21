import { generateText } from "ai";
import { model } from "./ai";
import { prisma } from "./prisma";
import { Ticket, TicketCategory } from "../generated/prisma";

const VALID_CATEGORIES = Object.values(TicketCategory);

const SYSTEM_PROMPT = `You are a support ticket classifier. Classify the support ticket into exactly one of these categories:
                        - general_questions: General inquiries, account questions, how-to questions
                        - technical_questions: Technical issues, bugs, errors, integration problems
                        - refund: Refund requests, billing disputes, cancellation requests

                        Respond with ONLY the category name, nothing else.`;

export async function classifyTicket(
  ticket: Ticket & { body: string },
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
