import { test, expect } from "./fixtures";
import { createTestUser, deleteTestUser } from "./helpers/create-user";

// Credentials from .env.test (seeded by global-setup → seed.ts)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test-admin-pw-123";
const ADMIN_NAME = "Admin";

// Dedicated agent account created/torn-down around the agent test group
const AGENT_EMAIL = "agent@test.com";
const AGENT_PASSWORD = "AgentPass123!";
const AGENT_NAME = "Test Agent";

// ---------------------------------------------------------------------------
// LOGIN PAGE — happy path
// ---------------------------------------------------------------------------

test.describe("Login page — happy path", () => {
  test("admin can sign in with valid credentials and is redirected to dashboard", async ({
    browser,
  }) => {
    // Use a fresh context with no stored session so we hit the actual login flow.
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await expect(page).toHaveURL("/login");

    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("/");
    await expect(page.getByText(ADMIN_NAME)).toBeVisible();

    await context.close();
  });

  test("navbar is visible with user name after successful sign in", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("/");

    // Navbar should render the user's name
    await expect(page.getByText(ADMIN_NAME)).toBeVisible();
    // Dashboard nav link is always present for authenticated users
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    await context.close();
  });
});

// ---------------------------------------------------------------------------
// LOGIN PAGE — client-side validation errors
// ---------------------------------------------------------------------------

test.describe("Login page — client-side validation errors", () => {
  // Each test creates its own fresh unauthenticated browser context and closes it
  // on completion so there is no shared mutable state between tests.

  test("submitting empty email shows 'Please enter a valid email address' error", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/login");
    // Leave email blank, fill password so only email validation fires
    await page.locator("#password").fill("anything");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
    // No server-side alert should appear
    await expect(page.getByRole("alert")).not.toBeVisible();

    await ctx.close();
  });

  test("submitting invalid email format shows validation error", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/login");
    await page.locator("#email").fill("notanemail");
    await page.locator("#password").fill("anything");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();

    await ctx.close();
  });

  test("submitting empty password shows 'Password is required' error", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/login");
    await page.locator("#email").fill("someone@example.com");
    // Leave password blank
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page.getByRole("alert")).not.toBeVisible();

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// LOGIN PAGE — server-side / auth errors
// ---------------------------------------------------------------------------

test.describe("Login page — server-side auth errors", () => {
  test("wrong password shows error alert banner", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    // The alert must contain some error text (Better Auth returns a message)
    await expect(alert).not.toBeEmpty();
    // User should remain on /login
    await expect(page).toHaveURL("/login");

    await context.close();
  });

  test("non-existent email shows error alert banner", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await page.locator("#email").fill("nobody@nowhere.example.com");
    await page.locator("#password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL("/login");

    await context.close();
  });
});

// ---------------------------------------------------------------------------
// LOGIN PAGE — already authenticated user
// ---------------------------------------------------------------------------

test.describe("Login page — already authenticated", () => {
  // This test inherits the admin storageState from playwright.config.ts
  test("already-authenticated admin visiting /login is redirected to /", async ({
    page,
  }) => {
    await page.goto("/login");
    // LoginPage renders <Navigate to="/" replace /> when session exists
    await expect(page).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// PROTECTED ROUTES — unauthenticated redirect
// ---------------------------------------------------------------------------

test.describe("Protected routes — unauthenticated access", () => {
  test("unauthenticated user visiting / is redirected to /login", async ({
    browser,
  }) => {
    const context = await browser.newContext(); // no storageState
    const page = await context.newPage();

    await page.goto("/");
    await expect(page).toHaveURL("/login");

    await context.close();
  });

  test("unauthenticated user visiting /users is redirected to /login", async ({
    browser,
  }) => {
    const context = await browser.newContext(); // no storageState
    const page = await context.newPage();

    // ProtectedLayout intercepts before AdminLayout and redirects to /login
    await page.goto("/users");
    await expect(page).toHaveURL("/login");

    await context.close();
  });
});

// ---------------------------------------------------------------------------
// SIGN OUT
// ---------------------------------------------------------------------------

test.describe("Sign out", () => {
  // These tests start from the pre-saved admin session.

  test("admin can sign out and is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("after sign out, visiting / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    // Navigate to root — session is gone, ProtectedLayout should redirect again
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// ADMIN ROLE — navbar and access
// ---------------------------------------------------------------------------

test.describe("Admin role — navbar and route access", () => {
  // Inherits admin storageState automatically.

  test("logged-in admin sees the Users nav link in the navbar", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("logged-in admin can access /users without being redirected", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    // UsersPage renders an <h1> with "Users"
    await expect(
      page.getByRole("heading", { name: "Users" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AGENT ROLE — navbar and access
// ---------------------------------------------------------------------------

test.describe("Agent role — navbar and route access", () => {
  test.beforeAll(async () => {
    await createTestUser({
      email: AGENT_EMAIL,
      password: AGENT_PASSWORD,
      name: AGENT_NAME,
    });
  });

  test.afterAll(async () => {
    await deleteTestUser(AGENT_EMAIL);
  });

  test("logged-in agent does not see the Users nav link", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await page.locator("#email").fill(AGENT_EMAIL);
    await page.locator("#password").fill(AGENT_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");

    // "Users" link should not be rendered for agents
    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
    // "Dashboard" is always present
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    await context.close();
  });

  test("logged-in agent visiting /users is redirected to /", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Sign in as agent
    await page.goto("/login");
    await page.locator("#email").fill(AGENT_EMAIL);
    await page.locator("#password").fill(AGENT_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");

    // Try to navigate to the admin-only route
    await page.goto("/users");

    // AdminLayout redirects non-admins to /
    await expect(page).toHaveURL("/");

    await context.close();
  });
});

// ---------------------------------------------------------------------------
// SIGN-UP DISABLED
// ---------------------------------------------------------------------------

test.describe("Sign-up is disabled", () => {
  test("POST /api/auth/sign-up/email returns an error, not 200", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:3001/api/auth/sign-up/email",
      {
        data: {
          email: "newuser@example.com",
          password: "SomePassword123!",
          name: "New User",
        },
      }
    );

    // Better Auth returns a non-2xx status when disableSignUp is true
    expect(response.ok()).toBe(false);
    expect(response.status()).not.toBe(200);
  });
});
