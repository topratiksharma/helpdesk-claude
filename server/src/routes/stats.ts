import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { TicketStatus } from "../generated/prisma";

export const statsRouter = Router();

statsRouter.get("/", requireAuth, async (_req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [totalTickets, openTickets, aiResolvedTickets, resolvedOrClosed, avgResult, dailyCounts] =
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
      prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("createdAt") AS date, COUNT(*) AS count
        FROM "Ticket"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

  const countMap = new Map(
    dailyCounts.map((r) => [r.date.toISOString().slice(0, 10), Number(r.count)]),
  );

  const ticketsPerDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date: label, count: countMap.get(key) ?? 0 };
  });

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
    ticketsPerDay,
  });
});
