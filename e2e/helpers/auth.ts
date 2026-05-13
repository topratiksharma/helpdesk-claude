import type { Browser, Page } from "@playwright/test";

export interface AuthContext {
  ctx: Awaited<ReturnType<Browser["newContext"]>>;
  page: Page;
}

/** Creates a fresh browser context with no session (ignores project storageState). */
export async function freshPage(browser: Browser): Promise<AuthContext> {
  const ctx = await browser.newContext({ storageState: undefined });
  const page = await ctx.newPage();
  return { ctx, page };
}

/** Opens a fresh context, navigates to /login, and signs in with the given credentials. */
export async function login(
  browser: Browser,
  email: string,
  password: string,
): Promise<AuthContext> {
  const { ctx, page } = await freshPage(browser);
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
  return { ctx, page };
}

/** Clicks the navbar Sign out button and waits for redirect to /login. */
export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("/login");
}
