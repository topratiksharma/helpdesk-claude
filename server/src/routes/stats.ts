import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { TicketStatus } from "../generated/prisma";

export const statsRouter = Router();

statsRouter.get("/", requireAuth, async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [openTickets, resolvedToday, totalTickets] = await Promise.all([
    prisma.ticket.count({ where: { status: TicketStatus.open } }),
    prisma.ticket.count({
      where: { status: TicketStatus.resolved, updatedAt: { gte: startOfToday } },
    }),
    prisma.ticket.count(),
  ]);

  res.json({ openTickets, resolvedToday, totalTickets });
});
