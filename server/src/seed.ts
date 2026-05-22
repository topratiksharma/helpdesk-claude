import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { Role } from "./generated/prisma";
import { prisma } from "./lib/prisma";
import { AI_AGENT_EMAIL, AI_AGENT_NAME } from "./lib/ai-agent";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

// ─── Seed agents ──────────────────────────────────────────────────────────────
// Add or remove entries here to adjust which agents get seeded.

const AGENTS = [
  { name: "Sarah Mitchell", email: "sarah.mitchell@example.com", password: "sarah1234" },
  { name: "James Carter",   email: "james.carter@example.com",   password: "james1234" },
  { name: "Priya Sharma",   email: "priya.sharma@example.com",   password: "priya1234" },
  { name: "Marcus Chen",    email: "marcus.chen@example.com",    password: "marcus1234" },
] as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createUser(
  name: string,
  email: string,
  password: string,
  role: Role,
): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  skipped  ${email} (already exists)`);
    return;
  }

  const now = new Date();
  const userId = crypto.randomUUID();
  const hashed = await hashPassword(password);

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      role,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashed,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`  created  ${email}  (password: ${password})`);
}

// ─── AI Agent ─────────────────────────────────────────────────────────────────

async function createAiAgent(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: AI_AGENT_EMAIL } });
  if (existing) {
    console.log(`  skipped  ${AI_AGENT_EMAIL} (already exists)`);
    return;
  }
  const now = new Date();
  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: AI_AGENT_EMAIL,
      name: AI_AGENT_NAME,
      role: Role.agent,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`  created  ${AI_AGENT_EMAIL}`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log("\nSeeding admin...");
await createUser("Admin", adminEmail, adminPassword, Role.admin);

console.log("\nSeeding AI agent...");
await createAiAgent();

console.log("\nSeeding agents...");
for (const agent of AGENTS) {
  await createUser(agent.name, agent.email, agent.password, Role.agent);
}

await prisma.$disconnect();
console.log("\nDone.\n");
