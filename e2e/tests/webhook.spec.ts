import { test, expect } from "../fixtures";

const API = process.env.SERVER_URL!;
const WEBHOOK_URL = `${API}/api/webhooks/inbound-email`;
const VALID_TOKEN = process.env.INBOUND_WEBHOOK_TOKEN!;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function webhookUrl(token?: string): string {
  return token ? `${WEBHOOK_URL}?token=${token}` : WEBHOOK_URL;
}

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    from: "customer@example.com",
    fromName: "Jane Customer",
    subject: "My widget is broken",
    text: "Please help me with my widget.",
    messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Creates a new ticket
// ---------------------------------------------------------------------------

test.describe("Inbound email webhook — new ticket creation", () => {
  test("valid payload via query token returns 200 and creates an open ticket", async ({
    request,
  }) => {
    const payload = basePayload();

    const webhookRes = await request.post(webhookUrl(VALID_TOKEN), {
      data: payload,
    });

    expect(webhookRes.status()).toBe(200);
    expect(await webhookRes.json()).toEqual({ ok: true });

    // Authenticated GET to confirm the ticket exists
    const listRes = await request.get(`${API}/api/tickets`);
    expect(listRes.ok()).toBe(true);

    const { tickets } = await listRes.json();
    const match = tickets.find(
      (t: { fromEmail: string; subject: string; status: string }) =>
        t.fromEmail === payload.from &&
        t.subject.toLowerCase().includes("widget is broken") &&
        t.status === "open",
    );

    expect(match).toBeDefined();
    expect(match.fromName).toBe(payload.fromName);
  });

  test("valid payload via x-webhook-secret header also returns 200", async ({
    request,
  }) => {
    const payload = basePayload({ subject: "Header auth test" });

    const webhookRes = await request.post(WEBHOOK_URL, {
      headers: { "x-webhook-secret": VALID_TOKEN },
      data: payload,
    });

    expect(webhookRes.status()).toBe(200);
    expect(await webhookRes.json()).toEqual({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// 2. Threads a reply onto an existing ticket
// ---------------------------------------------------------------------------

test.describe("Inbound email webhook — threading", () => {
  test("reply with inReplyTo attaches to existing ticket instead of creating a new one", async ({
    request,
  }) => {
    const firstMessageId = `thread-first-${Date.now()}`;
    const firstPayload = basePayload({
      subject: "Threading test subject",
      messageId: firstMessageId,
    });

    // Create the original ticket
    const firstRes = await request.post(webhookUrl(VALID_TOKEN), {
      data: firstPayload,
    });
    expect(firstRes.status()).toBe(200);

    // Get the ticket id before the reply
    const listBefore = await request.get(`${API}/api/tickets`);
    const { tickets: ticketsBefore } = await listBefore.json();
    const original = ticketsBefore.find(
      (t: { fromEmail: string; subject: string }) =>
        t.fromEmail === firstPayload.from &&
        t.subject.toLowerCase().includes("threading test subject"),
    );
    expect(original).toBeDefined();
    const ticketsBefore_count = ticketsBefore.length;

    // Post a reply referencing the first message
    const replyRes = await request.post(webhookUrl(VALID_TOKEN), {
      data: basePayload({
        subject: "Re: Threading test subject",
        messageId: `thread-reply-${Date.now()}`,
        inReplyTo: firstMessageId,
      }),
    });
    expect(replyRes.status()).toBe(200);

    // Ticket count should not have increased
    const listAfter = await request.get(`${API}/api/tickets`);
    const { tickets: ticketsAfter } = await listAfter.json();
    expect(ticketsAfter.length).toBe(ticketsBefore_count);

    // The original ticket should now have 2 messages
    const detailRes = await request.get(`${API}/api/tickets/${original.id}`);
    expect(detailRes.ok()).toBe(true);
    const { ticket } = await detailRes.json();
    expect(ticket.messages.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 3. Idempotency — duplicate messageId is silently ignored
// ---------------------------------------------------------------------------

test.describe("Inbound email webhook — idempotency", () => {
  test("posting the same messageId twice creates only one message", async ({
    request,
  }) => {
    const payload = basePayload({ subject: "Idempotency test" });

    // First POST
    const first = await request.post(webhookUrl(VALID_TOKEN), {
      data: payload,
    });
    expect(first.status()).toBe(200);

    // Second POST with identical payload (same messageId)
    const second = await request.post(webhookUrl(VALID_TOKEN), {
      data: payload,
    });
    expect(second.status()).toBe(200);
    expect(await second.json()).toEqual({ ok: true });

    // Find the ticket and confirm it has exactly 1 message
    const listRes = await request.get(`${API}/api/tickets`);
    const { tickets } = await listRes.json();
    const ticket = tickets.find(
      (t: { fromEmail: string; subject: string }) =>
        t.fromEmail === payload.from &&
        t.subject.toLowerCase().includes("idempotency test"),
    );
    expect(ticket).toBeDefined();

    const detailRes = await request.get(`${API}/api/tickets/${ticket.id}`);
    const { ticket: detail } = await detailRes.json();
    expect(detail.messages.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Reopens a resolved ticket on reply
// ---------------------------------------------------------------------------

test.describe("Inbound email webhook — reopen on reply", () => {
  test("reply to a resolved ticket reopens it to open status", async ({
    request,
  }) => {
    const firstMessageId = `reopen-first-${Date.now()}`;
    const payload = basePayload({
      subject: "Reopen on reply test",
      messageId: firstMessageId,
    });

    // Create the ticket via webhook
    const createRes = await request.post(webhookUrl(VALID_TOKEN), {
      data: payload,
    });
    expect(createRes.status()).toBe(200);

    // Find the ticket
    const listRes = await request.get(`${API}/api/tickets`);
    const { tickets } = await listRes.json();
    const ticket = tickets.find(
      (t: { fromEmail: string; subject: string }) =>
        t.fromEmail === payload.from &&
        t.subject.toLowerCase().includes("reopen on reply test"),
    );
    expect(ticket).toBeDefined();

    // Resolve the ticket via authenticated PATCH
    const patchRes = await request.patch(`${API}/api/tickets/${ticket.id}`, {
      data: { status: "resolved" },
    });
    expect(patchRes.ok()).toBe(true);
    const { ticket: resolved } = await patchRes.json();
    expect(resolved.status).toBe("resolved");

    // Post a reply via the webhook
    const replyRes = await request.post(webhookUrl(VALID_TOKEN), {
      data: basePayload({
        subject: "Re: Reopen on reply test",
        messageId: `reopen-reply-${Date.now()}`,
        inReplyTo: firstMessageId,
      }),
    });
    expect(replyRes.status()).toBe(200);

    // Ticket should now be open again
    const detailRes = await request.get(`${API}/api/tickets/${ticket.id}`);
    const { ticket: reopened } = await detailRes.json();
    expect(reopened.status).toBe("open");
  });
});

// ---------------------------------------------------------------------------
// 5. Authentication — missing or wrong token
// ---------------------------------------------------------------------------

test.describe("Inbound email webhook — authentication", () => {
  test("request without any token returns 401", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: basePayload(),
    });

    expect(res.status()).toBe(401);
  });

  test("request with wrong token returns 401", async ({ request }) => {
    const res = await request.post(webhookUrl("wrong-token-value"), {
      data: basePayload(),
    });

    expect(res.status()).toBe(401);
  });

  test("request with wrong x-webhook-secret header returns 401", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      headers: { "x-webhook-secret": "not-the-right-secret" },
      data: basePayload(),
    });

    expect(res.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 6. Validation — invalid payload
// ---------------------------------------------------------------------------

test.describe("Inbound email webhook — payload validation", () => {
  test("missing fromName returns 400", async ({ request }) => {
    const payload = basePayload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).fromName;

    const res = await request.post(webhookUrl(VALID_TOKEN), {
      data: payload,
    });

    expect(res.status()).toBe(400);
  });

  test("missing messageId returns 400", async ({ request }) => {
    const payload = basePayload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).messageId;

    const res = await request.post(webhookUrl(VALID_TOKEN), {
      data: payload,
    });

    expect(res.status()).toBe(400);
  });

  test("empty fromName returns 400", async ({ request }) => {
    const res = await request.post(webhookUrl(VALID_TOKEN), {
      data: basePayload({ fromName: "" }),
    });

    expect(res.status()).toBe(400);
  });

  test("invalid from email format returns 400", async ({ request }) => {
    const res = await request.post(webhookUrl(VALID_TOKEN), {
      data: basePayload({ from: "not-an-email" }),
    });

    expect(res.status()).toBe(400);
  });

  test("empty subject returns 400", async ({ request }) => {
    const res = await request.post(webhookUrl(VALID_TOKEN), {
      data: basePayload({ subject: "" }),
    });

    expect(res.status()).toBe(400);
  });
});
