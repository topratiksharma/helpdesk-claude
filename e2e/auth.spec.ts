import { test, expect } from "./fixtures";
import { freshPage, login, logout } from "./helpers/auth";
import { createTestUser, deleteTestUser } from "./helpers/create-user";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test-admin-pw-123";
const ADMIN_NAME = "Admin";

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
    const { ctx, page } = await login(browser, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page).toHaveURL("/");
    await expect(page.getByText(ADMIN_NAME, { exact: true })).toBeVisible();

    await ctx.close();
  });

  test("navbar is visible with user name after successful sign in", async ({
    browser,
  }) => {
    const { ctx, page } = await login(browser, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page.getByText(ADMIN_NAME, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// LOGIN PAGE — client-side validation errors
// ---------------------------------------------------------------------------

test.describe("Login page — client-side validation errors", () => {
  test("submitting empty email shows 'Please enter a valid email address' error", async ({
    browser,
  }) => {
    const { ctx, page } = await freshPage(browser);

    await page.goto("/login");
    await page.locator("#password").fill("anything");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Please enter a valid email address"),
    ).toBeVisible();
    await expect(page.getByRole("alert")).not.toBeVisible();

    await ctx.close();
  });

  test("submitting invalid email format shows validation error", async ({
    browser,
  }) => {
    const { ctx, page } = await freshPage(browser);

    await page.goto("/login");
    await page.locator("#email").fill("notanemail");
    await page.locator("#password").fill("anything");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Please enter a valid email address"),
    ).toBeVisible();

    await ctx.close();
  });

  test("submitting empty password shows 'Password is required' error", async ({
    browser,
  }) => {
    const { ctx, page } = await freshPage(browser);

    await page.goto("/login");
    await page.locator("#email").fill("someone@example.com");
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
    const { ctx, page } = await freshPage(browser);

    await page.goto("/login");
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");

    await ctx.close();
  });

  test("non-existent email shows error alert banner", async ({ browser }) => {
    const { ctx, page } = await freshPage(browser);

    await page.goto("/login");
    await page.locator("#email").fill("nobody@nowhere.example.com");
    await page.locator("#password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// LOGIN PAGE — already authenticated user
// ---------------------------------------------------------------------------

test.describe("Login page — already authenticated", () => {
  test("already-authenticated admin visiting /login is redirected to /", async ({
    page,
  }) => {
    await page.goto("/login");
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
    const { ctx, page } = await freshPage(browser);

    await page.goto("/");
    await expect(page).toHaveURL("/login");

    await ctx.close();
  });

  test("unauthenticated user visiting /users is redirected to /login", async ({
    browser,
  }) => {
    const { ctx, page } = await freshPage(browser);

    await page.goto("/users");
    await expect(page).toHaveURL("/login");

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// SIGN OUT — fresh login each time so the shared admin session stays intact
// ---------------------------------------------------------------------------

test.describe("Sign out", () => {
  test("admin can sign out and is redirected to /login", async ({
    browser,
  }) => {
    const { ctx, page } = await login(browser, ADMIN_EMAIL, ADMIN_PASSWORD);

    await logout(page);
    await expect(page).toHaveURL("/login");

    await ctx.close();
  });

  test("after sign out, visiting / redirects to /login", async ({
    browser,
  }) => {
    const { ctx, page } = await login(browser, ADMIN_EMAIL, ADMIN_PASSWORD);

    await logout(page);
    await page.goto("/");
    await expect(page).toHaveURL("/login");

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// ADMIN ROLE — navbar and access (uses inherited admin storageState)
// ---------------------------------------------------------------------------

test.describe("Admin role — navbar and route access", () => {
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
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
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
    const { ctx, page } = await login(browser, AGENT_EMAIL, AGENT_PASSWORD);

    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    await ctx.close();
  });

  test("logged-in agent visiting /users is redirected to /", async ({
    browser,
  }) => {
    const { ctx, page } = await login(browser, AGENT_EMAIL, AGENT_PASSWORD);

    await page.goto("/users");
    await expect(page).toHaveURL("/");

    await ctx.close();
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
      },
    );

    expect(response.ok()).toBe(false);
    expect(response.status()).not.toBe(200);
  });
});
