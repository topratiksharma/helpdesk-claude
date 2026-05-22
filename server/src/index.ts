import "./env";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { prisma } from "./lib/prisma";
import { requireAuth } from "./middleware/auth";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter";
import { usersRouter } from "./routes/users";
import { agentsRouter } from "./routes/agents";
import { ticketsRouter } from "./routes/tickets";
import { messagesRouter } from "./routes/messages";
import { statsRouter } from "./routes/stats";
import { inboundEmailRouter } from "./webhooks/inbound-email";
import { boss } from "./lib/boss";
import { registerClassifyTicketWorker } from "./jobs/classify-ticket.job";

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins = process.env.TRUSTED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(helmet());

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/tickets", messagesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/webhooks/inbound-email", inboundEmailRouter);

app.get("/api/me", requireAuth, (req, res) => {
  const { id, name, email, role } = req.user!;
  res.json({ id, name, email, role });
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

await boss.start();
await registerClassifyTicketWorker();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => boss.stop());
process.on("SIGINT", () => boss.stop());
