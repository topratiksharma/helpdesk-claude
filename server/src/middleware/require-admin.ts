import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { Role } from "../generated/prisma";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (session.user.deletedAt) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (session.user.role !== Role.admin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.user = session.user;
  req.session = session.session;
  next();
}
