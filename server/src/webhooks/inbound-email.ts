import { Router } from "express";
import multer from "multer";
import Parse from "@sendgrid/inbound-mail-parser";
import { createTicketSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { MessageSender, TicketStatus } from "../generated/prisma";
import { requireWebhookSecret } from "../middleware/webhook-auth";
import { boss } from "../lib/queue";
import { CLASSIFY_TICKET_JOB } from "../lib/classify-ticket";
import { AUTORESOLVE_TICKET_JOB } from "../lib/autoresolve-ticket";
import { getAiAgentId } from "../lib/ai-agent";

const upload = multer();

export const inboundEmailRouter = Router();

function parseFrom(raw: string): { email: string; name: string } {
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim();
    const email = match[2].trim().toLowerCase();
    return { name: name || email, email };
  }
  const email = raw.trim().toLowerCase();
  return { name: email, email };
}

function extractHeader(headers: string, name: string): string | undefined {
  const match = headers.match(new RegExp(`^${name}:\\s*(.+)`, "im"));
  return match?.[1]?.trim().replace(/^<|>$/g, "");
}

function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd?):\s*/i, "")
    .trim()
    .toLowerCase();
}

inboundEmailRouter.post("/", requireWebhookSecret, upload.any(), async (req, res) => {
  const parser = new Parse(
    { keys: ["from", "subject", "text", "html", "headers"] },
    { body: req.body, files: (req.files as Express.Multer.File[]) ?? [] },
  );

  const fields = parser.keyValues();
  const { email: from, name: fromName } = parseFrom(fields.from ?? "");
  const subject: string = fields.subject ?? "";
  const text: string = fields.text ?? "";
  const html: string = fields.html ?? "";
  const rawHeaders: string = fields.headers ?? "";
  const messageId = extractHeader(rawHeaders, "Message-ID") ?? "";
  const inReplyTo = extractHeader(rawHeaders, "In-Reply-To");

  if (!from || !subject || !messageId) {
    res.status(400).json({ error: "Missing required email fields." });
    return;
  }

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
    const ticketData = createTicketSchema.parse({
      subject,
      body,
      fromEmail: from,
      fromName,
    });

    const aiAgentId = await getAiAgentId();
    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          subject: ticketData.subject,
          fromEmail: ticketData.fromEmail,
          fromName: ticketData.fromName,
          lastInboundEmailId: messageId,
          ...(aiAgentId && { assignedToId: aiAgentId }),
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

    const basePayload = { id: newTicket.id, subject: newTicket.subject, body: body ?? "" };
    await Promise.all([
      boss.send(CLASSIFY_TICKET_JOB, basePayload),
      boss.send(AUTORESOLVE_TICKET_JOB, { ...basePayload, fromName: newTicket.fromName }),
    ]);
  }

  res.status(200).json({ ok: true });
});
