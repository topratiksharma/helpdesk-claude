---
name: Webhook API test patterns
description: How to write API-level Playwright tests for the inbound email webhook, including auth, threading, idempotency, and validation
type: reference
---

## Key setup required

- `.env.test` must include `INBOUND_WEBHOOK_TOKEN="test-webhook-token-e2e"`
- `playwright.config.ts` webServer env must forward `INBOUND_WEBHOOK_TOKEN: process.env.INBOUND_WEBHOOK_TOKEN!` to the test server
- Both changes were made when `e2e/webhook.spec.ts` was created

## API-level request tests

- Use the `request` fixture directly — no `page` or browser needed
- In chromium project tests, `request` automatically carries admin session cookies from `storageState: "e2e/.auth/admin.json"`
- This means `GET /api/tickets`, `PATCH /api/tickets/:id`, etc. work without extra auth setup
- Always use full URLs: `http://localhost:3001/api/...` (not relative — `baseURL` in config is the client port 5174)

## Webhook endpoint details

- URL: `POST http://localhost:3001/api/webhooks/inbound-email`
- Auth via query: `?token=<INBOUND_WEBHOOK_TOKEN>`
- Auth via header: `x-webhook-secret: <INBOUND_WEBHOOK_TOKEN>`
- No token → 401; wrong token → 401; missing body fields → 400

## Threading behavior

- Ticket is threaded (not new) when `inReplyTo` matches `lastInboundEmailId` on a ticket OR `emailMessageId` on any message in a ticket
- The `lastInboundEmailId` field is updated on every inbound message

## Idempotency

- Duplicate `messageId` (same `emailMessageId`) is silently accepted (200) but no new message is created

## Reopen behavior

- A reply to a `resolved` ticket sets status back to `open`; `closed` tickets are not reopened

## Subject normalization

- `normalizeSubject()` strips leading `re:` / `fwd:` prefixes and lowercases before subject-match fallback
- Ticket is stored with the original subject from `createTicketSchema`

## Payload deletion for missing-field tests

```ts
const payload = basePayload();
delete (payload as any).fromName; // omit a field to test validation
```
