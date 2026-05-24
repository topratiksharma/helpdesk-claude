---
name: Ticket detail page selectors
description: Locators and patterns for the ticket detail page — reply form, message thread, and status/category selects
type: reference
---

## Reply form

- Textarea: `page.getByPlaceholder("Write a reply…")`
- Submit button: `page.getByRole("button", { name: "Send reply" })`
- After successful submit the textarea is cleared and the reply body text appears directly in the thread (no dedicated wrapper to target — `page.getByText(replyText)` is sufficient)

## Status select (shadcn Select in TicketControls)

- Trigger: `page.getByRole("combobox", { name: /ticket status/i })` — aria-label is "Ticket status" set on `<SelectTrigger>`
- Options render in a portal with `role="option"`: `page.getByRole("option", { name: "Resolved" })`
- Display values: "Open", "Resolved", "Closed" (from `STATUS_LABELS` constant)
- To assert current value after navigation: `expect(page.getByRole("combobox", { name: /ticket status/i })).toHaveText("Resolved")`

## Category select

- Trigger: `page.getByRole("combobox", { name: /ticket category/i })` — aria-label is "Ticket category"
- Option values (from `CATEGORY_LABELS`): "No category", "General Questions", "Technical Questions", "Refund"
- Admin-only: agents see a plain text `<p>` instead of a select

## Assigned agent select

- Trigger: `page.getByRole("combobox", { name: /assigned agent/i })` — aria-label is "Assigned agent"
- Option values: "Unassigned" + one option per agent using `agent.name`
- Admin-only: agents see a plain text `<p>` instead of a select

## Ticket helper

- Helper: `e2e/helpers/create-ticket.ts` — `createTestTicket(options)` / `deleteTestTicket(id: number)`
- `createTestTicket` returns `{ id: number }` (autoincrement PK)
- Cascade delete removes messages automatically via Prisma `onDelete: Cascade`
- Use `beforeAll`/`afterAll` (not `beforeEach`/`afterEach`) — ticket is shared across tests in the describe block
