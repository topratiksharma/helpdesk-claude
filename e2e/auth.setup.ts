import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

const adminAuthFile = path.join(__dirname, ".auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill(process.env.ADMIN_EMAIL!);
  await page.locator("#password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");

  fs.mkdirSync(path.dirname(adminAuthFile), { recursive: true });
  await page.context().storageState({ path: adminAuthFile });
});
