import { hashPassword } from "better-auth/crypto";
import { Role } from "../../server/src/generated/prisma";
import { prisma } from "../../server/src/lib/prisma";

export interface TestUserOptions {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export async function createTestUser(options: TestUserOptions): Promise<void> {
  const { email, password, name, role = Role.agent } = options;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { email } });
  }

  const hashed = await hashPassword(password);
  const userId = crypto.randomUUID();

  const now = new Date();

  const user = await prisma.user.create({
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
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashed,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function deleteTestUser(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.delete({ where: { email } });
  }
}
