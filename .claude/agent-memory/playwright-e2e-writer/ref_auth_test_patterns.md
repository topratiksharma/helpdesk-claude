---
name: Auth test patterns
description: Conventions for handling authenticated vs unauthenticated contexts in auth.spec.ts and related tests
type: reference
---

## Admin session (default)
All `chromium` project tests inherit `storageState: "e2e/.auth/admin.json"` from `playwright.config.ts`. Tests that need an already-logged-in admin simply use the `page` fixture directly — no explicit login steps.

## Unauthenticated context
Create a fresh context with no storageState using the `browser` fixture:
```ts
const context = await browser.newContext(); // no storageState arg → no session
const page = await context.newPage();
// ...
await context.close();
```
This is the correct pattern for testing redirects, login flows, and other flows that must not inherit the saved admin session.

## Agent user
Agent users are created via `e2e/helpers/create-user.ts` which calls `auth.api.signUpEmail` server-side (bypasses `disableSignUp`) then optionally sets role via Prisma. Sign in the agent via UI in a fresh browser context. The agent tests use `test.beforeAll`/`test.afterAll` to create and delete the user around the describe block.

## Sign-up disabled assertion
Better Auth with `disableSignUp: true` returns a non-2xx response to `POST /api/auth/sign-up/email`. Assert with:
```ts
expect(response.ok()).toBe(false);
expect(response.status()).not.toBe(200);
```
Use the hardcoded server URL `http://localhost:3001` in `request.post()` because the `request` fixture baseURL points to the client port.

## Key timing pattern
After clicking "Sign in", always `await page.waitForURL("/")` before making assertions on the post-login page. This is more reliable than asserting on the button state.
