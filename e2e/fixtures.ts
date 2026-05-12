import { test as base, expect } from "@playwright/test";

export { expect };

// Re-export test with project-level storageState (admin) already applied via playwright.config.ts.
// Extend this with page-object models and DB helpers as the test suite grows.
export const test = base;
