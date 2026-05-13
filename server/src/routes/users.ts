import { Router, type Response } from "express";
import { type ZodSchema } from "zod";
import { hashPassword } from "better-auth/crypto";
import { createUserSchema, updateUserSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/require-admin";
import { Role } from "../generated/prisma";

function validate<T>(schema: ZodSchema<T>, body: unknown, res: Response): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return null;
  }
  return result.data;
}

export const usersRouter = Router();

usersRouter.get("/", requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

usersRouter.post("/", requireAdmin, async (req, res) => {
  const data = validate(createUserSchema, req.body, res);
  if (!data) return;

  const { name, email, password } = data;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
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
        role: Role.agent,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
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

usersRouter.patch("/:id", requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  const data = validate(updateUserSchema, req.body, res);
  if (!data) return;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const { name, email, password } = data;

  if (email && email.toLowerCase() !== existing.email.toLowerCase()) {
    const conflict = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, NOT: { id } },
    });
    if (conflict) {
      res.status(409).json({ error: "A user with that email already exists." });
      return;
    }
  }

  const userUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) userUpdate.name = name;
  if (email !== undefined) userUpdate.email = email;

  if (password !== undefined) {
    const hashed = await hashPassword(password);
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: userUpdate,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashed, updatedAt: new Date() },
      }),
    ]);
    res.json({ user });
  } else {
    const user = await prisma.user.update({
      where: { id },
      data: userUpdate,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ user });
  }
});

usersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  if (id === req.user!.id) {
    res.status(400).json({ error: "You cannot delete your own account." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.role === Role.admin) {
    res.status(403).json({ error: "Admin users cannot be deleted." });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  res.status(204).send();
});
