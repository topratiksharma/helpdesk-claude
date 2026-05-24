import { test, expect } from "../fixtures";
import { createTestUser, deleteTestUser } from "../helpers/create-user";
import { createTestTicket, deleteTestTicket } from "../helpers/create-ticket";
import { login } from "../helpers/auth";
import { Role } from "../../server/src/generated/prisma";

const AGENT_EMAIL = "agent-role-test@e2e.test";
const AGENT_PASSWORD = "AgentPass123!";
const AGENT_NAME = "Test Agent";

// ---------------------------------------------------------------------------
// Role access — agent restrictions
// ---------------------------------------------------------------------------

test.describe("Role access — agent restrictions", () => {
  let ticketId: number;

  test.beforeAll(async () => {
    await createTestUser({
      email: AGENT_EMAIL,
      password: AGENT_PASSWORD,
      name: AGENT_NAME,
      role: Role.agent,
    });

    const ticket = await createTestTicket({
      subject: "Role access test ticket",
      fromEmail: "role-access-customer@test.com",
      fromName: "Role Access Customer",
    });
    ticketId = ticket.id;
  });

  test.afterAll(async () => {
    await deleteTestTicket(ticketId);
    await deleteTestUser(AGENT_EMAIL);
  });

  test("agent is redirected away from /users", async ({ browser }) => {
    const { ctx, page } = await login(browser, AGENT_EMAIL, AGENT_PASSWORD);
    try {
      await page.goto("/users");
      await page.waitForURL("/");
      await expect(
        page.getByRole("heading", { name: /good to see you/i }),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test("agent can access /tickets", async ({ browser }) => {
    const { ctx, page } = await login(browser, AGENT_EMAIL, AGENT_PASSWORD);
    try {
      await page.goto("/tickets");
      await expect(
        page.getByRole("heading", { name: /tickets/i }),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test("agent can view a ticket detail page", async ({ browser }) => {
    const { ctx, page } = await login(browser, AGENT_EMAIL, AGENT_PASSWORD);
    try {
      await page.goto(`/tickets/${ticketId}`);
      await expect(
        page.getByRole("heading", { name: /role access test ticket/i }),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test("admin can access /users", async ({ page }) => {
    await page.goto("/users");
    await expect(
      page.getByRole("heading", { name: /users/i }),
    ).toBeVisible();
  });
});
