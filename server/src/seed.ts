import "dotenv/config";
import { Role } from "./generated/prisma";
import { auth } from "./lib/auth";
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

await auth.api.signUpEmail({
  body: { email, password, name: "Admin" },
});

await prisma.user.update({
  where: { email },
  data: { role: Role.admin },
});

console.log(`Admin user ${email} created successfully.`);
await prisma.$disconnect();
