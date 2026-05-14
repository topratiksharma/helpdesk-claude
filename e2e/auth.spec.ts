import { test, expect } from "./fixtures";
import { login, logout } from "./helpers/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test-admin-pw-123";
const ADMIN_NAME = "Admin";

// ---------------------------------------------------------------------------
// LOGIN — happy path (real Better Auth session required)
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
// SIGN OUT — real session invalidation required
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
// SIGN-UP DISABLED — real API required
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
