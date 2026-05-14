import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const SERVER_PORT = 3001;
const CLIENT_PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  outputDir: "e2e/test-results",
  reporter: [["html", { outputFolder: "e2e/playwright-report" }]],
  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "bun run dev:server",
      url: `http://localhost:${SERVER_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: process.env.DATABASE_URL!,
        PORT: String(SERVER_PORT),
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
        BETTER_AUTH_URL: `http://localhost:${SERVER_PORT}`,
        TRUSTED_ORIGINS: `http://localhost:${CLIENT_PORT}`,
        INBOUND_WEBHOOK_TOKEN: process.env.INBOUND_WEBHOOK_TOKEN!,
      },
    },
    {
      command: "bun run dev:client",
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: !process.env.CI,
      env: {
        API_URL: `http://localhost:${SERVER_PORT}`,
        PORT: String(CLIENT_PORT),
      },
    },
  ],
});
