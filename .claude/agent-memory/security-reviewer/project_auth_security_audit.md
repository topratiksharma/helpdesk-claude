---
name: Auth Security Audit - Initial Findings
description: Security audit findings for helpdesk-claude auth/authorization layer, covering soft-delete bypass, missing admin enforcement, seed script, CORS, and AdminLayout race condition
type: project
---

Initial security audit completed on 2026-05-11. Key findings documented below.

**Why:** Full auth/authorization audit of the existing codebase to surface exploitable vulnerabilities before features are built on top.

**How to apply:** When reviewing future changes to auth middleware, route handlers, or user management, reference these findings to ensure they are remediated before new code is layered on top.

## Critical / High Findings

1. **Soft-delete not enforced in requireAuth** (`server/src/middleware/auth.ts`): The `requireAuth` middleware calls `auth.api.getSession()` which validates the session token but does NOT check `user.deletedAt`. A user whose `deletedAt` is set can still authenticate with an existing session. The Prisma schema's `User` model does not even have a `deletedAt` column — it is declared as a Better Auth additional field (`input: false`) but absent from the actual schema. This means soft-delete is partially implemented and currently provides no protection.

2. **`/api/auth/sign-up/email` potentially reachable** (`server/src/lib/auth.ts`): `disableSignUp: true` is set. Verified — this is correctly configured.

3. **`/api/health` raw Prisma query** (`server/src/index.ts`, line 21): Uses `prisma.$queryRaw\`SELECT 1\`` — no user input is interpolated, so no SQL injection risk. The endpoint is unauthenticated but returns only status info.

4. **Seed script calls `auth.api.signUpEmail` directly** (`server/src/seed.ts`, line 26): Even though `disableSignUp: true` is set on the HTTP-level config, calling `auth.api.signUpEmail` from server-side code bypasses that restriction. This is the intended admin seeding path and is not exploitable externally.

5. **AdminLayout race condition** (`client/src/layouts/AdminLayout.tsx`): No `isPending` guard — while session is loading, `session?.user.role` is `undefined`, which is not equal to `Role.admin`, so non-admins are correctly redirected. However, during the loading window `<Outlet />` is not rendered prematurely. Low risk — but no loading state shown.

6. **`/api/me` leaks full user object** (`server/src/index.ts`, line 15-17): Returns the entire `req.user` object including `role`, `emailVerified`, internal timestamps. Not a critical leak but over-exposes internal fields.

7. **No server-side admin role check on any route**: The application currently has no admin-only API routes (only UI routes for `/users`). When admin CRUD endpoints are added, they must enforce `req.user.role === 'admin'` server-side — AdminLayout is client-only.

## Schema Issue

The `User` model in `server/prisma/schema.prisma` does NOT have a `deletedAt` field. Better Auth is configured with `deletedAt` as an additional field, but without the schema column, soft-delete is non-functional at the database level.

## CORS

`trustedOrigins` reads from `TRUSTED_ORIGINS` env var split by comma. Empty array if env var unset — Better Auth defaults may allow same-origin only. Should be validated to not accidentally allow `*`.
