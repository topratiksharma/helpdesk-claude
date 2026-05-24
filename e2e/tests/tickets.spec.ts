import { test, expect } from "../fixtures";
import { createTestTicket, deleteTestTicket } from "../helpers/create-ticket";
import { createTestUser, deleteTestUser } from "../helpers/create-user";
import { Role } from "../../server/src/generated/prisma";

// ---------------------------------------------------------------------------
// Reply submission — proves real DB write + refetch
// ---------------------------------------------------------------------------

test.describe("Ticket detail — reply submission", () => {
  let ticketId: number;

  test.beforeAll(async () => {
    const ticket = await createTestTicket({
      subject: "Reply test ticket",
      fromEmail: "customer-reply@test.com",
      fromName: "Reply Customer",
    });
    ticketId = ticket.id;
  });

  test.afterAll(async () => {
    await deleteTestTicket(ticketId);
  });

  test("reply appears in the thread after submission", async ({ page }) => {
    const replyText = `E2E reply ${Date.now()}`;

    await page.goto(`/tickets/${ticketId}`);

    await page.getByPlaceholder("Write a reply…").fill(replyText);
    await page.getByRole("button", { name: "Send reply" }).click();

    await expect(page.getByText(replyText)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Status change — proves real DB write persists across navigation
// ---------------------------------------------------------------------------

test.describe("Ticket detail — status change", () => {
  let ticketId: number;

  test.beforeAll(async () => {
    const ticket = await createTestTicket({
      subject: "Status test ticket",
      fromEmail: "customer-status@test.com",
      fromName: "Status Customer",
    });
    ticketId = ticket.id;
  });

  test.afterAll(async () => {
    await deleteTestTicket(ticketId);
  });

  test("status change persists after navigating away and back", async ({
    page,
  }) => {
    await page.goto(`/tickets/${ticketId}`);

    await page.getByRole("combobox", { name: /ticket status/i }).click();
    await page.getByRole("option", { name: "Resolved" }).click();

    await page.goto("/tickets");
    await page.waitForURL("/tickets");

    await page.goto(`/tickets/${ticketId}`);

    await expect(
      page.getByRole("combobox", { name: /ticket status/i }),
    ).toHaveText("Resolved");
  });
});

// ---------------------------------------------------------------------------
// Category change — proves real DB write persists across navigation
// ---------------------------------------------------------------------------

test.describe("Ticket detail — category change", () => {
  let ticketId: number;

  test.beforeAll(async () => {
    const ticket = await createTestTicket({
      subject: "Category test ticket",
      fromEmail: "category-test@test.com",
      fromName: "Category Customer",
    });
    ticketId = ticket.id;
  });

  test.afterAll(async () => {
    await deleteTestTicket(ticketId);
  });

  test("category change persists after navigating away and back", async ({
    page,
  }) => {
    await page.goto(`/tickets/${ticketId}`);

    await page.getByRole("combobox", { name: /ticket category/i }).click();
    await page.getByRole("option", { name: "Technical Questions" }).click();

    await page.goto("/tickets");
    await page.waitForURL("/tickets");

    await page.goto(`/tickets/${ticketId}`);

    await expect(
      page.getByRole("combobox", { name: /ticket category/i }),
    ).toHaveText("Technical Questions");
  });
});

// ---------------------------------------------------------------------------
// Agent assignment — proves real DB write persists across navigation
// ---------------------------------------------------------------------------

test.describe("Ticket detail — agent assignment", () => {
  const AGENT_EMAIL = "assign-agent@e2e.test";
  const AGENT_NAME = "Assign Agent";
  const AGENT_PASSWORD = "AssignPass123!";

  let ticketId: number;

  test.beforeAll(async () => {
    await createTestUser({
      email: AGENT_EMAIL,
      password: AGENT_PASSWORD,
      name: AGENT_NAME,
      role: Role.agent,
    });

    const ticket = await createTestTicket({
      subject: "Assignment test ticket",
      fromEmail: "assign-customer@test.com",
      fromName: "Assign Customer",
    });
    ticketId = ticket.id;
  });

  test.afterAll(async () => {
    await deleteTestTicket(ticketId);
    await deleteTestUser(AGENT_EMAIL);
  });

  test("agent assignment persists after navigating away and back", async ({
    page,
  }) => {
    await page.goto(`/tickets/${ticketId}`);

    await page.getByRole("combobox", { name: /assigned agent/i }).click();
    await page.getByRole("option", { name: AGENT_NAME }).click();

    await page.goto("/tickets");
    await page.waitForURL("/tickets");

    await page.goto(`/tickets/${ticketId}`);

    await expect(
      page.getByRole("combobox", { name: /assigned agent/i }),
    ).toHaveText(AGENT_NAME);
  });
});
