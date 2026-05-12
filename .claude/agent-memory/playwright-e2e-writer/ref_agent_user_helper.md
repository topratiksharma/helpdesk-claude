---
name: Agent user helper
description: How to create and clean up test agent users in E2E tests via e2e/helpers/create-user.ts
type: reference
---

## File: `e2e/helpers/create-user.ts`

Imports directly from the server package (Bun resolves monorepo paths):
```ts
import { prisma } from "../../server/src/lib/prisma";
import { auth } from "../../server/src/lib/auth";
import { Role } from "../../server/src/generated/prisma";
```

### `createTestUser({ email, password, name, role? })`
- Deletes any existing user with that email first (idempotent)
- Calls `auth.api.signUpEmail({ body: { email, password, name } })` — this is a server-side call that bypasses `disableSignUp: true`
- If `role !== Role.agent`, updates the role via `prisma.user.update`

### `deleteTestUser(email)`
- Finds user by email and deletes (cascade removes sessions and accounts via Prisma schema)

## Usage pattern in test files
```ts
test.describe("Agent role tests", () => {
  test.beforeAll(async () => {
    await createTestUser({ email: AGENT_EMAIL, password: AGENT_PASSWORD, name: AGENT_NAME });
  });
  test.afterAll(async () => {
    await deleteTestUser(AGENT_EMAIL);
  });
  // tests use fresh browser.newContext() to sign in as agent
});
```

## Agent credentials used in auth.spec.ts
- Email: `agent@test.com`
- Password: `AgentPass123!`
- Name: `Test Agent`
