import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/require-admin";

export const agentsRouter = Router();

agentsRouter.get("/", requireAdmin, async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json({ agents });
});
