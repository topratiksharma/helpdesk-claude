import { readFileSync } from "fs";
import { join } from "path";
import { generateText } from "ai";
import { model } from "./ai";
import { prisma } from "./prisma";
import { boss } from "./queue";
import { sendEmail } from "./email";
import { MessageSender, TicketStatus } from "../generated/prisma";

export const AUTORESOLVE_TICKET_JOB = "autoresolve-ticket";

export interface AutoresolveTicketPayload {
  id: number;
  subject: string;
  body: string;
  fromName: string;
}

const faqContent = readFileSync(join(import.meta.dir, "../../../FAQ.md"), "utf-8");

const SYSTEM_PROMPT = `You are a professional customer support agent. Using ONLY the FAQ below, determine if the customer's question can be fully answered.

If yes, reply with exactly:
RESOLVED
<your reply>

Your reply must follow these rules:
- Open with "Dear [first name]," on its own line — the first name will be provided
- Use a professional, warm, and empathetic tone throughout
- Separate distinct points into short paragraphs for readability
- Do not use bullet points or markdown — plain text only
- Close with the following signature on its own lines:

Best regards,
Support Team
Helpdesk Claude

If the FAQ does not contain enough information to fully answer the question, reply with exactly:
UNRESOLVED

Do not invent or assume any information not explicitly stated in the FAQ.

FAQ:
---
${faqContent}
---`;

export async function autoResolveTicket(
  payload: AutoresolveTicketPayload,
): Promise<void> {
  await prisma.ticket.update({
    where: { id: payload.id },
    data: { status: TicketStatus.processing },
  });

  try {
  const firstName = payload.fromName.split(" ")[0];

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Customer first name: ${firstName}\nSubject: ${payload.subject}\n\n${payload.body}`,
    maxRetries: 0,
  });

  const trimmed = text.trim();

  if (trimmed.toUpperCase().startsWith("RESOLVED")) {
    const reply = trimmed.replace(/^RESOLVED\s*/i, "").trim();
    const htmlBody = reply
      .split(/\n\n+/)
      .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("\n");

    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: payload.id },
    });

    await prisma.$transaction([
      prisma.message.create({
        data: {
          ticketId: payload.id,
          body: reply,
          htmlBody,
          sender: MessageSender.agent,
        },
      }),
      prisma.ticket.update({
        where: { id: payload.id },
        data: { status: TicketStatus.resolved },
      }),
    ]);

    await sendEmail({
      to: ticket.fromEmail,
      toName: ticket.fromName,
      subject: `Re: ${ticket.subject}`,
      body: reply,
    });
  } else {
    await prisma.ticket.update({
      where: { id: payload.id },
      data: { status: TicketStatus.open },
    });
  }
  } catch (err) {
    await prisma.ticket.update({
      where: { id: payload.id },
      data: { status: TicketStatus.open },
    });
    throw err;
  }
}

export async function registerAutoResolveTicketWorker(): Promise<void> {
  await boss.createQueue(AUTORESOLVE_TICKET_JOB, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });
  await boss.work<AutoresolveTicketPayload>(
    AUTORESOLVE_TICKET_JOB,
    async (jobs) => {
      for (const job of jobs) {
        await autoResolveTicket(job.data);
      }
    },
  );
}
