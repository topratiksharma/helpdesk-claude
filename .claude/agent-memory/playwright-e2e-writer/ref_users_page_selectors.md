---
name: Users page selectors and patterns
description: Locator patterns and test conventions specific to the /users page and user management dialogs
type: reference
---

## Page layout locators
- Heading: `page.getByRole("heading", { name: "Users" })`
- Subtext: `page.getByText("Manage agents and admins who have access to this workspace.")`
- Add user button: `page.getByRole("button", { name: "Add user" })`
- Table cells: `page.getByRole("cell", { name: "<email or name>" })`

## Add user dialog
- Opened by clicking the "Add user" button (sets `dialogUser` state to `undefined`)
- Dialog heading: `page.getByRole("heading", { name: "Add user" })`
- Name field: `page.locator("#user-name")`
- Email field: `page.locator("#user-email")`
- Password field: `page.locator("#user-password")`
- Submit: `page.getByRole("button", { name: "Create user" })`
- Pending state button text: "Creating…"
- On success: dialog closes (heading no longer visible), new row appears in table

## Edit user dialog
- Opened by clicking `aria-label="Edit <name>"` button on a table row
- Edit button locator: `page.getByRole("button", { name: "Edit <name>" })`
- Dialog heading: `page.getByRole("heading", { name: "Edit user" })`
- Same field IDs as add form (#user-name, #user-email, #user-password)
- Password placeholder: "Leave blank to keep current password"
- Submit: `page.getByRole("button", { name: "Save changes" })`
- Pending state button text: "Saving…"

## Delete confirmation (AlertDialog)
- Opened by clicking `aria-label="Delete <name>"` button — only rendered for agents (not admins)
- Delete button locator: `page.getByRole("button", { name: "Delete <name>" })`
- Dialog heading: `page.getByRole("heading", { name: "Delete <name>?" })`
- Confirm: `page.getByRole("button", { name: "Delete" })`
- Cancel: `page.getByRole("button", { name: "Cancel" })`

## Validation error messages (from Zod schema in @helpdesk/core)
- Name too short: "Name must be at least 3 characters"
- Invalid email: "Please enter a valid email address"
- Password too short: "Password must be at least 8 characters"
- API errors displayed via `role="alert"` inside the form

## Admin row behaviour
- Admin users have an Edit button but NO Delete button (conditionally rendered in UsersTable)
- The Delete button is also disabled (not just hidden) if `user.id === currentUserId`

## Fixture patterns used in users.spec.ts
- Create: `test.afterAll` cleans up via `deleteTestUser(email)` — use a timestamp email so tests don't collide
- Edit: `test.beforeAll`/`test.afterAll` with a fixed email constant (idempotent via `createTestUser` which deletes existing first)
- Delete: `test.beforeAll` only (test itself cleans up by deleting); self-contained cancel test creates+deletes inline
