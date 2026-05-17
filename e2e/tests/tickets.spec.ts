import { test, expect } from "../fixtures";
import { createTestTicket, deleteTestTicket } from "../helpers/create-ticket";

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
