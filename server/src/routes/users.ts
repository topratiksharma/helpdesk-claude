import { Router } from "express";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/require-admin";
import { Role } from "../generated/prisma";

export const usersRouter = Router();

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "agent"]).default("agent"),
});

usersRouter.get("/", requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

usersRouter.post("/", requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, email, password, role } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with that email already exists." });
    return;
  }

  const now = new Date();
  const userId = crypto.randomUUID();
  const hashed = await hashPassword(password);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: role as Role,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashed,
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  res.status(201).json({ user });
});

usersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    res.status(400).json({ error: "You cannot delete your own account." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
});
