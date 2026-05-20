import { Router } from "express";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createMessageSchema, refineReplySchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { validate, parseIntParam } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { MessageSender } from "../generated/prisma";

export const messagesRouter = Router({ mergeParams: true });

messagesRouter.post("/refine", requireAuth, async (req, res) => {
  const data = validate(refineReplySchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: data.ticketId },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const customerName = ticket.fromName.split(" ")[0];
  const agentName = req.user!.name;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b"), // 2. Change model to Groq's free llama,
      system: `You are a professional customer support agent.
              Improve the clarity, tone, and professionalism of the 
              reply while keeping its intent and length similar.
              Address the customer by their name "${customerName}" 
              and sign off with the agent's name "${agentName}".
              Return only the improved reply text with no other output.`,
      prompt: data.body,
      maxRetries: 0,
    });
    res.json({ refined: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[messages/refine]", message);
    res.status(502).json({ error: message });
  }
});

messagesRouter.post("/:ticketId/summarize", requireAuth, async (req, res) => {
  const ticketId = parseIntParam(req.params.ticketId, res);
  if (ticketId === null) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const thread = ticket.messages
    .map((m) => {
      const who =
        m.sender === "agent" ? (m.author?.name ?? "Agent") : ticket.fromName;
      return `${who}: ${m.body}`;
    })
    .join("\n\n");

  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash-lite"),
      system: `You are a customer support analyst. Summarize this support ticket conversation in 2-4 sentences. Cover: what the customer's issue is, what steps have been taken, and the current status. Be factual and concise. Return only the summary text.`,
      prompt: `Subject: ${ticket.subject}\n\n${thread}`,
      maxRetries: 0,
    });
    res.json({ summary: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[messages/summarize]", message);
    res.status(502).json({ error: message });
  }
});

messagesRouter.post("/:ticketId/messages", requireAuth, async (req, res) => {
  const ticketId = parseIntParam(req.params.ticketId, res);
  if (ticketId === null) return;

  const data = validate(createMessageSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const message = await prisma.message.create({
    data: {
      ticketId,
      body: data.body,
      htmlBody: data.bodyHtml,
      sender:
        data.sender === "agent" ? MessageSender.agent : MessageSender.customer,
      authorId: req.user!.id,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json({ message });
});
