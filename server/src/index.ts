import "./instrument";
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
import { startQueue, stopQueue } from "./lib/queue";
import { registerClassifyTicketWorker } from "./lib/classify-ticket";
import { registerAutoResolveTicketWorker } from "./lib/autoresolve-ticket";
import { registerSendReplyEmailWorker } from "./lib/send-reply-email";
import compression from "compression";
import * as Sentry from "@sentry/node";

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins =
  process.env.TRUSTED_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(helmet());
app.use(compression());

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

Sentry.setupExpressErrorHandler(app);

await startQueue();
await Promise.all([
  registerClassifyTicketWorker(),
  registerAutoResolveTicketWorker(),
  registerSendReplyEmailWorker(),
]);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown() {
  server.close(() => stopQueue());
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
