import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import type { StatsResponse } from "@helpdesk/core";

export const statsRouter = Router();

statsRouter.get("/", requireAuth, async (_req, res) => {
  const [row] = await prisma.$queryRaw<[{ get_ticket_stats: StatsResponse }]>`
    SELECT get_ticket_stats()
  `;
  res.json(row.get_ticket_stats);
});
