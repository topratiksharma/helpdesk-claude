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
| Auth | Database sessions |
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

## Key Conventions
- Use bun as the runtime and package manager
- Use TypeScript throughOut
- Use context7 MCP server to fetch upto-date documentation for libraries.

## Implementation Phases

1. Project Scaffold ✅
2. Database & Auth (Prisma schema, sessions, login/logout)
3. Ticket Core (CRUD API + list/detail UI)
4. Dashboard (stats + navigation layout)
5. AI Features (classification, summary, suggested reply)
6. Email Integration (inbound webhook + outbound replies)
7. User Management (admin-only agent CRUD)
8. Polish & Deployment
