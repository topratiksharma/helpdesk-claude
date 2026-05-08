import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "ok", db: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
