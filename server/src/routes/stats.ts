import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { TicketStatus } from "../generated/prisma";

export const statsRouter = Router();

statsRouter.get("/", requireAuth, async (_req, res) => {
  const [totalTickets, openTickets, aiResolvedTickets, resolvedOrClosed, avgResult] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.open } }),
      prisma.ticket.count({ where: { autoResolved: true } }),
      prisma.ticket.count({
        where: { status: { in: [TicketStatus.resolved, TicketStatus.closed] } },
      }),
      prisma.$queryRaw<[{ avg_hours: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) AS avg_hours
        FROM "Ticket" WHERE "resolvedAt" IS NOT NULL
      `,
    ]);

  const aiResolutionPercentage =
    resolvedOrClosed > 0
      ? Math.round((aiResolvedTickets / resolvedOrClosed) * 1000) / 10
      : 0;

  res.json({
    totalTickets,
    openTickets,
    aiResolvedTickets,
    aiResolutionPercentage,
    avgResolutionTimeHours: avgResult[0]?.avg_hours ?? null,
  });
});
