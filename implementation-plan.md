# Implementation Plan

## Phase 1 — Project Scaffold

- Initialize monorepo with `client/` and `server/` directories
- **Client**: React + TypeScript + React Router + Tailwind + shadcn/ui
- **Server**: Node + TypeScript + Express, basic health-check route
- Configure shared TypeScript settings (`tsconfig`)
- Set up `.env` files and environment variable handling
- Configure ESLint + Prettier for both packages

---

## Phase 2 — Database & Auth

- Initialize Prisma, connect to PostgreSQL
- Define schema:
  - `User` (id, name, email, password hash, role: admin | agent, createdAt)
  - `Session` (id, userId, expiresAt)
  - `Ticket` (id, subject, body, status: open | resolved | closed, category, assignedTo, createdAt, updatedAt)
  - `Message` (id, ticketId, body, sender: agent | ai | customer, createdAt)
- Run initial migration
- Seed script: create default admin user
- Auth endpoints: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Session middleware: attach user to request on every route
- Protected route middleware (blocks unauthenticated requests)
- Frontend: login page
- Frontend: auth context + protected route wrapper

---

## Phase 3 — Ticket Core

- `POST /tickets` — create ticket (used by email webhook later)
- `GET /tickets` — list tickets with filtering (status, category) and sorting (date, status)
- `GET /tickets/:id` — ticket detail with messages
- `PATCH /tickets/:id` — update status, category, assignee
- `POST /tickets/:id/messages` — add a message (agent reply)
- Frontend: ticket list page with filters and sort controls
- Frontend: ticket detail page with message thread and reply box
- Frontend: status update controls (open → resolved → closed)

---

## Phase 4 — Dashboard

- `GET /dashboard/stats` — counts by status and category
- Frontend: dashboard page with stat cards (open tickets, resolved today, by category)
- Navigation layout: sidebar with Dashboard, Tickets, Users (admin only)

---

## Phase 5 — AI Features

- Integrate Claude API (Anthropic SDK) in server
- **Auto-classification**: on ticket creation, call Claude to assign category
- **AI summary**: `GET /tickets/:id/summary` — summarize ticket thread
- **AI suggested reply**: `GET /tickets/:id/suggest-reply` — draft a reply based on thread + knowledge base
- Knowledge base: flat markdown/text files loaded as context for Claude prompts
- Surface AI suggestions in ticket detail UI (editable before sending)

---

## Phase 6 — Email Integration

- Set up inbound email webhook (Postmark/SendGrid) → `POST /webhooks/inbound-email`
- Parse incoming email → create `Ticket` + initial `Message`
- Outbound: when agent sends a reply, send email to customer via Postmark/SendGrid
- Handle basic threading (link replies to existing ticket via email subject/headers)

---

## Phase 7 — User Management

- `GET /users` — list all agents (admin only)
- `POST /users` — create new agent (admin only)
- `PATCH /users/:id` — update agent (admin only)
- `DELETE /users/:id` — deactivate agent (admin only)
- Frontend: users page (admin only, hidden from agents)

---

## Phase 8 — Polish & Deployment

- Form validation and error messages throughout UI
- Loading and empty states
- Toast notifications for actions (ticket updated, reply sent, etc.)
- Dockerize server + configure for production
- Deploy: server to Railway/Render, client to Vercel, DB to Supabase/Railway
- Environment-specific config and secrets management
