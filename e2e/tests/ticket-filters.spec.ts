import { test, expect } from "../fixtures";
import { createTestTicket, deleteTestTicket } from "../helpers/create-ticket";
import { TicketStatus, TicketCategory } from "../../server/src/generated/prisma";

// ---------------------------------------------------------------------------
// Ticket list — status filter, category filter, and search
// ---------------------------------------------------------------------------

test.describe("Ticket list — filters", () => {
  let ticketIdA: number;
  let ticketIdB: number;
  let ticketIdC: number;

  test.beforeAll(async () => {
    const [ticketA, ticketB, ticketC] = await Promise.all([
      createTestTicket({
        subject: "Filter test open general",
        fromEmail: "filter-a@test.com",
        fromName: "Filter A",
        status: TicketStatus.open,
        category: TicketCategory.general_questions,
      }),
      createTestTicket({
        subject: "Filter test resolved technical",
        fromEmail: "filter-b@test.com",
        fromName: "Filter B",
        status: TicketStatus.resolved,
        category: TicketCategory.technical_questions,
      }),
      createTestTicket({
        subject: "Filter test open refund",
        fromEmail: "filter-c@test.com",
        fromName: "Filter C",
        status: TicketStatus.open,
        category: TicketCategory.refund,
      }),
    ]);
    ticketIdA = ticketA.id;
    ticketIdB = ticketB.id;
    ticketIdC = ticketC.id;
  });

  test.afterAll(async () => {
    await Promise.all([
      deleteTestTicket(ticketIdA),
      deleteTestTicket(ticketIdB),
      deleteTestTicket(ticketIdC),
    ]);
  });

  test("shows all seeded tickets by default", async ({ page }) => {
    await page.goto("/tickets");

    await expect(page.getByText("Filter test open general")).toBeVisible();
    await expect(page.getByText("Filter test resolved technical")).toBeVisible();
    await expect(page.getByText("Filter test open refund")).toBeVisible();
  });

  test("filter by Open shows only open tickets", async ({ page }) => {
    await page.goto("/tickets");

    await page.getByRole("button", { name: "Open" }).click();

    await expect(page.getByText("Filter test open general")).toBeVisible();
    await expect(page.getByText("Filter test open refund")).toBeVisible();
    await expect(
      page.getByText("Filter test resolved technical"),
    ).not.toBeVisible();
  });

  test("filter by Resolved shows only resolved tickets", async ({ page }) => {
    await page.goto("/tickets");

    await page.getByRole("button", { name: "Resolved" }).click();

    await expect(page.getByText("Filter test resolved technical")).toBeVisible();
    await expect(
      page.getByText("Filter test open general"),
    ).not.toBeVisible();
    await expect(
      page.getByText("Filter test open refund"),
    ).not.toBeVisible();
  });

  test("filter All restores all tickets after applying a status filter", async ({
    page,
  }) => {
    await page.goto("/tickets");

    await page.getByRole("button", { name: "Open" }).click();
    await expect(
      page.getByText("Filter test resolved technical"),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "All" }).click();

    await expect(page.getByText("Filter test open general")).toBeVisible();
    await expect(page.getByText("Filter test resolved technical")).toBeVisible();
    await expect(page.getByText("Filter test open refund")).toBeVisible();
  });

  test("search by subject substring shows matching ticket", async ({ page }) => {
    await page.goto("/tickets");

    await page
      .getByPlaceholder("Search tickets…")
      .fill("resolved technical");

    // Wait for the 400ms debounce + network round-trip
    await page.waitForTimeout(500);

    await expect(page.getByText("Filter test resolved technical")).toBeVisible();
    await expect(
      page.getByText("Filter test open general"),
    ).not.toBeVisible();
    await expect(
      page.getByText("Filter test open refund"),
    ).not.toBeVisible();
  });

  test("search with no matches shows empty state", async ({ page }) => {
    await page.goto("/tickets");

    await page.getByPlaceholder("Search tickets…").fill("zzznomatch");

    // Wait for the 400ms debounce + network round-trip
    await page.waitForTimeout(500);

    await expect(page.getByText(/no tickets yet/i)).toBeVisible();
  });
});
