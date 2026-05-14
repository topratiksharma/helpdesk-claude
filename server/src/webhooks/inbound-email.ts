import { Router, type Request, type Response, type NextFunction } from "express";
import { inboundEmailSchema, createTicketSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { MessageSender, TicketStatus } from "../generated/prisma";

function requireWebhookToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INBOUND_WEBHOOK_TOKEN;
  if (!expected) {
    res.status(500).json({ error: "Webhook not configured." });
    return;
  }
  const provided =
    (req.query.token as string | undefined) ?? req.headers["x-webhook-token"];
  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  next();
}

function normalizeSubject(subject: string): string {
  return subject.replace(/^(re|fwd?):\s*/i, "").trim().toLowerCase();
}

export const inboundEmailRouter = Router();

inboundEmailRouter.post("/", requireWebhookToken, async (req, res) => {
  const result = inboundEmailSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { from, fromName, subject, text, html, messageId, inReplyTo } = result.data;
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
          ...(ticket.status === TicketStatus.resolved && { status: TicketStatus.open }),
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

    await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          subject: ticketData.subject,
          fromEmail: ticketData.fromEmail,
          fromName: ticketData.fromName,
          lastInboundEmailId: messageId,
        },
      });
      await tx.message.create({
        data: {
          ticketId: newTicket.id,
          body: ticketData.body,
          htmlBody: html || null,
          sender: MessageSender.customer,
          emailMessageId: messageId,
        },
      });
    });
  }

  res.status(200).json({ ok: true });
});
