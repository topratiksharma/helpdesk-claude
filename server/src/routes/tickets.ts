import { Router } from "express";
import { z } from "zod";
import { createTicketSchema, updateTicketSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/require-admin";
import { MessageSender } from "../generated/prisma";

const listTicketsQuerySchema = z.object({
  status: z.enum(["open", "resolved", "closed"]).optional(),
  category: z.enum(["general_questions", "technical_questions", "refund"]).optional(),
  assignedToId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ticketsRouter = Router();

ticketsRouter.get("/", requireAuth, async (req, res) => {
  const query = listTicketsQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.issues[0].message });
    return;
  }

  const { status, category, assignedToId, page, limit } = query.data;
  const where = {
    ...(status !== undefined && { status }),
    ...(category !== undefined && { category }),
    ...(assignedToId !== undefined && { assignedToId }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total, page, limit });
});

ticketsRouter.post("/", requireAuth, async (req, res) => {
  const data = validate(createTicketSchema, req.body, res);
  if (!data) return;

  const { subject, body, fromEmail, fromName, category, assignedToId } = data;

  const [ticket] = await prisma.$transaction([
    prisma.ticket.create({
      data: {
        subject,
        fromEmail,
        fromName,
        category: category ?? null,
        assignedToId: assignedToId ?? null,
        messages: {
          create: {
            body,
            sender: MessageSender.agent,
            authorId: req.user!.id,
          },
        },
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: true,
      },
    }),
  ]);

  res.status(201).json({ ticket });
});

ticketsRouter.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ticket ID." }); return; }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  res.json({ ticket });
});

ticketsRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ticket ID." }); return; }

  const data = validate(updateTicketSchema, req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const update: Record<string, unknown> = {};
  if (data.status !== undefined) update.status = data.status;
  if (data.category !== undefined) update.category = data.category;
  if (data.assignedToId !== undefined) update.assignedToId = data.assignedToId;
  if (data.subject !== undefined) update.subject = data.subject;

  const ticket = await prisma.ticket.update({
    where: { id },
    data: update,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ ticket });
});

ticketsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ticket ID." }); return; }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  await prisma.ticket.delete({ where: { id } });
  res.status(204).send();
});
