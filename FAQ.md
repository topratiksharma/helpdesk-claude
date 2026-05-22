# Helpdesk Claude — FAQ

## Table of Contents

- [General](#general)
- [Setup & Configuration](#setup--configuration)
- [Email Ingestion](#email-ingestion)
- [Ticket Management](#ticket-management)
- [AI Features](#ai-features)
- [User & Role Management](#user--role-management)
- [Background Jobs & Queue](#background-jobs--queue)
- [Troubleshooting](#troubleshooting)

---

## General

**What is Helpdesk Claude?**
An AI-powered support ticket system. Inbound customer emails are automatically converted into tickets, classified by topic, and surfaced to agents with AI-generated summaries and suggested replies.

**Who are the intended users?**
Two roles exist:
- **Admin** — manages agents and users, has full access including ticket deletion.
- **Agent** — handles the day-to-day ticket queue: reads, replies, and updates ticket status.

**Can customers log in?**
No. Customers interact only via email. The web application is for agents and admins.

---

## Setup & Configuration

**What are the required environment variables?**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default `3000`) |
| `BETTER_AUTH_SECRET` | 64-character hex secret for session signing |
| `BETTER_AUTH_URL` | Auth base URL (e.g. `http://localhost:3000`) |
| `TRUSTED_ORIGINS` | Comma-separated CORS origins (e.g. `http://localhost:5173`) |
| `ADMIN_EMAIL` | Email for the initial admin account (seeded on first run) |
| `ADMIN_PASSWORD` | Password for the initial admin account |
| `INBOUND_WEBHOOK_TOKEN` | Secret token for authenticating inbound email webhooks |
| `GROQ_API_KEY` | Groq API key for AI classification, summarisation, and reply refinement |

Copy `server/.env.example` to `server/src/.env` and fill in every value before starting.

**How do I run the application locally?**
```bash
# Start the API server (port 3000, hot-reload)
bun run dev:server

# Start the React client (port 5173, proxies /api to server)
bun run dev:client
```

**How is the database initialised?**
Run the Prisma migration and seed the admin account:
```bash
cd server
bun run db:migrate   # applies Prisma migrations
bun run db:seed      # creates the initial admin user
```

**Does pg-boss require its own database setup?**
No. The background job queue manages its own `pgboss` schema automatically the first time the server starts — no extra migration step is needed.

---

## Email Ingestion

**How do emails become tickets?**
Your email provider (Postmark, SendGrid, etc.) is configured to forward inbound mail to:
```
POST /api/webhooks/inbound-email
```
The request must include the header `x-webhook-secret: <INBOUND_WEBHOOK_TOKEN>`.

**What fields does the webhook expect?**

| Field | Required | Description |
|---|---|---|
| `from` | Yes | Sender email address |
| `fromName` | Yes | Sender display name |
| `subject` | Yes | Email subject |
| `text` | No | Plain-text body |
| `html` | No | HTML body |
| `messageId` | Yes | Unique message ID (used for idempotency) |
| `inReplyTo` | No | Message-ID of the email being replied to |

**What happens if the same email is delivered twice?**
Nothing — the webhook is idempotent. If a `messageId` has already been processed, the request returns `200 { ok: true }` immediately without creating a duplicate.

**How does email threading work?**
The system attempts to attach an incoming email to an existing ticket using three strategies in order:
1. Match the `inReplyTo` header against a ticket's `lastInboundEmailId`.
2. Match the `inReplyTo` header against any message's `emailMessageId`.
3. Match the normalised subject line and sender email against an open or resolved ticket from the same customer.

If no match is found, a new ticket is created.

**Does a reply from the customer re-open a resolved ticket?**
Yes. If an email is threaded into a ticket whose status is `resolved`, the ticket is automatically moved back to `open`.

---

## Ticket Management

**What are the possible ticket statuses?**
`open` → `resolved` → `closed`

Tickets start as `open`. Agents mark them `resolved` when handled. `closed` is a terminal state.

**What categories can a ticket be assigned?**

| Category | Typical content |
|---|---|
| `general_questions` | Account queries, how-to questions, general enquiries |
| `technical_questions` | Bugs, errors, integration issues |
| `refund` | Billing disputes, cancellation requests, refund requests |

Categories are set automatically by the AI classifier after a new ticket is created, and can be overridden manually by an agent at any time.

**Can agents be assigned to tickets?**
Yes. Any agent can be assigned to a ticket from the ticket detail view. Tickets can also be filtered by assignee from the ticket list.

**Can tickets be deleted?**
Only admins can permanently delete a ticket.

---

## AI Features

**Which AI model is used?**
[Groq](https://groq.com) inference with `llama-3.3-70b-versatile`. The model is configured in `server/src/lib/ai.ts`.

**What AI features are available?**

| Feature | Where | What it does |
|---|---|---|
| Auto-classification | Background (on ticket creation) | Assigns one of three categories to a new ticket |
| Ticket summary | Ticket detail page | Generates a 2–4 sentence summary of the full conversation |
| Reply refinement | Reply form | Rewrites an agent's draft to improve clarity, tone, and professionalism |

**Is AI output applied automatically?**
Classification is applied automatically in the background. Summaries and refined replies are suggestions — an agent must explicitly request them and can edit or discard the result before sending.

**What happens if the AI returns an unexpected classification?**
The job fails with an error. It will be retried up to **3 times** with exponential backoff (30 s → 60 s → 120 s). If all retries are exhausted the job is marked `failed` in the `pgboss.job` table and the ticket's category remains blank.

---

## User & Role Management

**How is the first admin account created?**
It is seeded by `bun run db:seed` using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. Self-registration is disabled at the API level.

**Can agents sign themselves up?**
No. Only an admin can create agent accounts through the user management UI.

**What happens to tickets when an agent is deleted?**
Deletion is a soft-delete (`deletedAt` is set). The agent's assigned tickets are reassigned and their active sessions are cleared. The account is no longer visible in the UI but its data is retained for audit purposes.

**Can an admin demote themselves?**
Admins can only be managed by other admins. An admin cannot remove their own role to prevent accidental lockout.

---

## Background Jobs & Queue

**What queue technology is used?**
[pg-boss](https://github.com/timgit/pg-boss) — a PostgreSQL-backed job queue. No Redis or separate queue service is required.

**Where are jobs stored?**
In a `pgboss` schema inside the same PostgreSQL database. You can inspect jobs directly:
```sql
SELECT id, name, state, data, output, created_on
FROM pgboss.job
WHERE name = 'classify-ticket'
ORDER BY created_on DESC;
```

**Are jobs durable across server restarts?**
Yes. Jobs are persisted to PostgreSQL before the webhook response is sent. If the server crashes mid-classification, the job remains in the queue and is picked up on next start.

**What are the retry settings for the classification job?**

| Setting | Value |
|---|---|
| Retry limit | 3 attempts |
| Retry delay | 30 seconds |
| Backoff | Exponential (30 s → 60 s → 120 s) |

---

## Troubleshooting

**The server fails to start with "Queue start timed out after 30s".**
The server cannot reach PostgreSQL within 30 seconds. Check that `DATABASE_URL` is correct and the database is reachable from the server process.

**Tickets are being created but the `category` column stays blank.**
The classification job is either still queued or has failed. Check the `pgboss.job` table (see query above) — the `state` column will be `failed` and `output` will contain the error message. Common causes: invalid `GROQ_API_KEY`, AI returning an unexpected category string, or a network timeout reaching the Groq API.

**Inbound emails return `401 Unauthorized`.**
The `x-webhook-secret` header value does not match `INBOUND_WEBHOOK_TOKEN`. Verify both are identical, with no leading/trailing whitespace.

**Reply refinement or summarisation returns an error.**
Both features call the Groq API synchronously. Confirm `GROQ_API_KEY` is set and that the account has sufficient quota. Errors are returned as JSON with an `error` field.

**Login always fails, even with the correct credentials.**
Rate limiting kicks in after 10 failed login attempts per 15-minute window. Wait for the window to expire, or restart the server to clear in-memory state. Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` match what was seeded.

**The client shows CORS errors.**
Add the client's origin (e.g. `http://localhost:5173`) to the `TRUSTED_ORIGINS` environment variable on the server and restart.
