import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { Role } from "./generated/prisma";
import { prisma } from "./lib/prisma";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  if (existing.role !== Role.admin) {
    await prisma.user.update({ where: { email }, data: { role: Role.admin } });
    console.log(`Updated ${email} role to admin.`);
  } else {
    console.log(`Admin user ${email} already exists — skipping.`);
  }
  await prisma.$disconnect();
  process.exit(0);
}

const hashed = await hashPassword(password);

const userId = crypto.randomUUID();

const now = new Date();

const user = await prisma.user.create({
  data: {
    id: userId,
    email,
    name: "Admin",
    role: Role.admin,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  },
});

await prisma.account.create({
  data: {
    id: crypto.randomUUID(),
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    password: hashed,
    createdAt: now,
    updatedAt: now,
  },
});

console.log(`Admin user ${email} created successfully.`);
await prisma.$disconnect();
