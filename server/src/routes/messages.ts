import { Router } from "express";
import { createMessageSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { validate, parseIntParam } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { MessageSender } from "../generated/prisma";

export const messagesRouter = Router({ mergeParams: true });

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
      sender: data.sender === "agent" ? MessageSender.agent : MessageSender.customer,
      authorId: req.user!.id,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json({ message });
});
