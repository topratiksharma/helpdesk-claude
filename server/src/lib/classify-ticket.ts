import { generateText } from "ai";
import { model } from "./ai";
import { prisma } from "./prisma";
import { TicketCategory } from "../generated/prisma";

const VALID_CATEGORIES = Object.values(TicketCategory);

const SYSTEM_PROMPT = `You are a support ticket classifier. Classify the support ticket into exactly one of these categories:
- general_questions: General inquiries, account questions, how-to questions
- technical_questions: Technical issues, bugs, errors, integration problems
- refund: Refund requests, billing disputes, cancellation requests

Respond with ONLY the category name, nothing else.`;

export async function classifyTicket(
  ticketId: number,
  subject: string,
  body: string
): Promise<void> {
  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Subject: ${subject}\n\n${body}`,
    maxRetries: 0,
  });

  const category = text.trim().toLowerCase() as TicketCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`Unexpected category from AI: ${text.trim()}`);
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { category },
  });
}
