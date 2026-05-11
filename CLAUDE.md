# Helpdesk Claude — Project Memory

## Project Overview

AI-powered ticket management system that receives support emails, auto-classifies them, generates AI-suggested replies, and lets agents manage tickets through a dashboard.

See `project-scope.md` for full feature list and `implementation-plan.md` for the phased build plan.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + React Router v7 + Vite |
| Backend | Node.js + TypeScript + Express v5 |
| Runtime / Package manager | Bun (`~/.bun/bin/bun`) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Better Auth (database sessions) |
| AI | Claude API (Anthropic) |
| Email | Postmark or SendGrid |
| UI | Tailwind CSS + shadcn/ui |

## Monorepo Structure

```
helpdesk-claude/
├── CLAUDE.md
├── package.json          # Bun workspace root
├── tsconfig.base.json    # Shared TS config extended by client + server
├── .env.example
├── client/               # React app (port 5173)
│   ├── vite.config.ts    # Proxies /api/* → localhost:3000
│   └── src/
│       ├── main.tsx      # createBrowserRouter + RouterProvider
│       └── App.tsx
└── server/               # Express app (port 3000)
    └── src/
        └── index.ts
```

## Running the Project

```bash
# Server (Express on :3000, hot-reload via bun --watch)
bun run dev:server

# Client (Vite on :5173, proxies /api to server)
bun run dev:client
```

> Bun binary is at `~/.bun/bin/bun` — scripts in package.json use this full path.

## Domain Model

**Ticket statuses:** `open` → `resolved` → `closed`

**Ticket categories:** `General Questions`, `Technical Questions`, `Refund`

**User roles:**
- `admin` — seeded on first deploy; manages agents and users
- `agent` — created by admin; works tickets

## Documentation

Always use **Context7** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`) to fetch up-to-date documentation before writing code that uses any library or framework — including React, React Router, Express, Prisma, Bun, Vite, shadcn/ui, and the Anthropic SDK. Do not rely on training-data knowledge for API shapes, config formats, or CLI commands.

## Authentication

Powered by **Better Auth** with email/password (sign-up disabled — users are seeded/created by admin only).

**Server (`server/src/lib/auth.ts`):**
- `basePath: "/api/auth"` — all auth endpoints live under `/api/auth/*`
- Prisma adapter backed by PostgreSQL
- Custom user fields: `role` (`admin` | `agent`, default `agent`) and `deletedAt` (soft delete)
- Route handler: `app.all("/api/auth/*splat", toNodeHandler(auth))` in `server/src/index.ts`
- Trusted origins read from `TRUSTED_ORIGINS` env var (comma-separated)

**Middleware (`server/src/middleware/auth.ts`):**
- `requireAuth` — validates session via `auth.api.getSession`, attaches `req.user` and `req.session`, returns 401 if unauthenticated
- Apply to any protected Express route: `router.get("/tickets", requireAuth, handler)`

**Client (`client/src/lib/auth-client.ts`):**
- `useSession()` — React hook, returns `{ data: session, isPending }`; uses a shared cache so calling it in multiple components is safe
- `signIn.email({ email, password })` — returns `{ error }` on failure
- `signOut()` — clears session
- `ProtectedLayout` (`client/src/layouts/ProtectedLayout.tsx`) redirects unauthenticated users to `/login`
- `AdminLayout` (`client/src/layouts/AdminLayout.tsx`) redirects non-admins to `/`

**Role enum (`client/src/lib/constants.ts`):**
- Always use `Role.admin` / `Role.agent` — never raw strings

**Creating users (sign-up is disabled at API level):**
Hash with `hashPassword` from `better-auth/crypto`, then insert a `User` row and a linked `Account` row (`providerId: "credential"`) directly via Prisma.

## shadcn/ui

Components live in `client/src/components/ui/`. Add new ones with:

```bash
cd client && bunx shadcn add <component>
```

The theme uses Tailwind v4's `@theme inline` in `client/src/index.css` — shadcn's default neutral palette via CSS variables (`--primary`, `--background`, `--foreground`, `--muted`, etc.). No `tailwind.config.js`. Dark mode is class-based (`.dark` on `<html>`).

Use shadcn utility classes in components: `bg-primary`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-destructive`, etc.

## Key Conventions
- Use bun as the runtime and package manager
- Use TypeScript throughout
- Use context7 MCP server to fetch up-to-date documentation for libraries.

## Implementation Phases

1. Project Scaffold ✅
2. Database & Auth (Prisma schema, sessions, login/logout)
3. Ticket Core (CRUD API + list/detail UI)
4. Dashboard (stats + navigation layout)
5. AI Features (classification, summary, suggested reply)
6. Email Integration (inbound webhook + outbound replies)
7. User Management (admin-only agent CRUD)
8. Polish & Deployment
