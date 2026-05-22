import { Router } from "express";
import { inboundEmailSchema, createTicketSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { validate } from "../lib/validate";
import { MessageSender, TicketStatus } from "../generated/prisma";
import { requireWebhookSecret } from "../middleware/webhook-auth";
import { boss } from "../lib/boss";
import { CLASSIFY_TICKET_JOB } from "../jobs/classify-ticket.job";

export const inboundEmailRouter = Router();

function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd?):\s*/i, "")
    .trim()
    .toLowerCase();
}

inboundEmailRouter.post("/", requireWebhookSecret, async (req, res) => {
  const data = validate(inboundEmailSchema, req.body, res);
  if (!data) return;

  const { from, fromName, subject, text, html, messageId, inReplyTo } = data;
  const body = text || html;

  // Idempotency: skip if we've already processed this message
  const existing = await prisma.message.findFirst({
    where: { emailMessageId: messageId },
  });
  if (existing) {
    res.status(200).json({ ok: true });
    return;
  }

  // Threading: find an existing ticket to attach this message to
  let ticket = null;

  if (inReplyTo) {
    ticket = await prisma.ticket.findFirst({
      where: { lastInboundEmailId: inReplyTo },
    });

    if (!ticket) {
      const matchingMessage = await prisma.message.findFirst({
        where: { emailMessageId: inReplyTo },
        select: { ticketId: true },
      });
      if (matchingMessage) {
        ticket = await prisma.ticket.findUnique({
          where: { id: matchingMessage.ticketId },
        });
      }
    }
  }

  if (!ticket) {
    const normalized = normalizeSubject(subject);
    ticket = await prisma.ticket.findFirst({
      where: {
        fromEmail: { equals: from, mode: "insensitive" },
        status: { not: TicketStatus.closed },
        subject: { equals: normalized, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (ticket) {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          ticketId: ticket.id,
          body,
          htmlBody: html || null,
          sender: MessageSender.customer,
          emailMessageId: messageId,
        },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          lastInboundEmailId: messageId,
          ...(ticket.status === TicketStatus.resolved && {
            status: TicketStatus.open,
          }),
        },
      }),
    ]);
  } else {
    // Validate ticket creation data using the shared schema
    const ticketData = createTicketSchema.parse({
      subject,
      body,
      fromEmail: from,
      fromName,
    });

    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          subject: ticketData.subject,
          fromEmail: ticketData.fromEmail,
          fromName: ticketData.fromName,
          lastInboundEmailId: messageId,
        },
      });
      await tx.message.create({
        data: {
          ticketId: ticket.id,
          body: ticketData.body,
          htmlBody: html || null,
          sender: MessageSender.customer,
          emailMessageId: messageId,
        },
      });
      return ticket;
    });

    await boss.send(CLASSIFY_TICKET_JOB, {
      id: newTicket.id,
      subject: newTicket.subject,
      body: body ?? "",
    });
  }

  res.status(200).json({ ok: true });
});
