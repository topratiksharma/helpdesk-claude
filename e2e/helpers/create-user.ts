/**
 * Helper to create a test agent user directly via the server's auth API and Prisma.
 * Sign-up is disabled at the HTTP API level, so we call auth.api.signUpEmail
 * server-side (which bypasses the disableSignUp guard) and then update the role.
 */
import { prisma } from "../../server/src/lib/prisma";
import { auth } from "../../server/src/lib/auth";
import { Role } from "../../server/src/generated/prisma";

export interface TestUserOptions {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

/**
 * Creates a user with the given options. If the user already exists it is
 * deleted first so each test suite starts from a clean state.
 */
export async function createTestUser(options: TestUserOptions): Promise<void> {
  const { email, password, name, role = Role.agent } = options;

  // Remove any existing user with this email to ensure idempotency.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { email } });
  }

  // auth.api.signUpEmail bypasses disableSignUp because it is a server-side call.
  await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (role !== Role.agent) {
    await prisma.user.update({ where: { email }, data: { role } });
  }
}

/**
 * Deletes a test user and all cascade-deleted sessions/accounts.
 */
export async function deleteTestUser(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.delete({ where: { email } });
  }
}
