import { test, expect } from "./fixtures";
import { createTestUser, deleteTestUser } from "./helpers/create-user";

// ---------------------------------------------------------------------------
// READ — page loads and lists users
// ---------------------------------------------------------------------------

test.describe("Users page — read", () => {
  test("admin can navigate to /users and see the page heading", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(
      page.getByRole("heading", { name: "Users" }),
    ).toBeVisible();
    await expect(
      page.getByText("Manage agents and admins who have access to this workspace."),
    ).toBeVisible();
  });

  test("users table lists the seeded admin user", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("cell", { name: "admin@example.com" })).toBeVisible();
  });

  test("Add user button is visible on the page", async ({ page }) => {
    await page.goto("/users");
    await expect(
      page.getByRole("button", { name: "Add user" }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// CREATE — add a new user via the dialog form
// ---------------------------------------------------------------------------

test.describe("Users page — create", () => {
  let createdEmail: string;

  test.afterAll(async () => {
    if (createdEmail) {
      await deleteTestUser(createdEmail);
    }
  });

  test("admin can open Add user dialog and create a new agent", async ({
    page,
  }) => {
    const timestamp = Date.now();
    createdEmail = `agent-${timestamp}@test.com`;
    const agentName = `Test Agent ${timestamp}`;

    await page.goto("/users");

    await page.getByRole("button", { name: "Add user" }).click();

    await expect(
      page.getByRole("heading", { name: "Add user" }),
    ).toBeVisible();

    await page.locator("#user-name").fill(agentName);
    await page.locator("#user-email").fill(createdEmail);
    await page.locator("#user-password").fill("TestPass123!");

    await page.getByRole("button", { name: "Create user" }).click();

    // Dialog should close and the new user should appear in the table
    await expect(
      page.getByRole("heading", { name: "Add user" }),
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: agentName, exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: createdEmail, exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// EDIT — update an existing user's name
// ---------------------------------------------------------------------------

test.describe("Users page — edit", () => {
  const EDIT_EMAIL = "edit-fixture@test.com";
  const EDIT_PASSWORD = "EditPass123!";
  const ORIGINAL_NAME = "Edit Fixture User";
  const UPDATED_NAME = "Updated Fixture User";

  test.beforeAll(async () => {
    await createTestUser({
      email: EDIT_EMAIL,
      password: EDIT_PASSWORD,
      name: ORIGINAL_NAME,
    });
  });

  test.afterAll(async () => {
    await deleteTestUser(EDIT_EMAIL);
  });

  test("admin can edit an agent's name and see the updated name in the table", async ({
    page,
  }) => {
    await page.goto("/users");

    await expect(page.getByRole("cell", { name: ORIGINAL_NAME, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Edit ${ORIGINAL_NAME}` }).click();

    await expect(
      page.getByRole("heading", { name: "Edit user" }),
    ).toBeVisible();

    const nameInput = page.locator("#user-name");
    await nameInput.clear();
    await nameInput.fill(UPDATED_NAME);

    await page.getByRole("button", { name: "Save changes" }).click();

    // Dialog should close and the updated name should appear
    await expect(
      page.getByRole("heading", { name: "Edit user" }),
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: UPDATED_NAME, exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// DELETE — remove a user via the alert dialog
// ---------------------------------------------------------------------------

test.describe("Users page — delete", () => {
  const DELETE_EMAIL = "delete-fixture@test.com";
  const DELETE_PASSWORD = "DeletePass123!";
  const DELETE_NAME = "Delete Fixture User";

  test.beforeAll(async () => {
    await createTestUser({
      email: DELETE_EMAIL,
      password: DELETE_PASSWORD,
      name: DELETE_NAME,
    });
  });

  test("admin can delete an agent and the user is removed from the table", async ({
    page,
  }) => {
    await page.goto("/users");

    await expect(page.getByRole("cell", { name: DELETE_NAME, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${DELETE_NAME}` }).click();

    // Alert dialog should appear
    await expect(
      page.getByRole("heading", { name: `Delete ${DELETE_NAME}?` }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "This will permanently remove the user and revoke their access. This action cannot be undone.",
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).click();

    // User should no longer appear in the table
    await expect(
      page.getByRole("cell", { name: DELETE_NAME, exact: true }),
    ).not.toBeVisible();
  });

  test("cancelling the delete dialog keeps the user in the table", async ({
    page,
  }) => {
    // Re-create the user since it may have been deleted in the previous test.
    // This test is self-sufficient: it creates and then cancels deletion.
    const email = `cancel-delete-${Date.now()}@test.com`;
    const name = "Cancel Delete User";
    await createTestUser({ email, name, password: "CancelPass123!" });

    await page.goto("/users");
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await expect(
      page.getByRole("heading", { name: `Delete ${name}?` }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close, user still visible
    await expect(
      page.getByRole("heading", { name: `Delete ${name}?` }),
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();

    // Clean up
    await deleteTestUser(email);
  });

  test("admin user does not have a delete button in the table", async ({
    page,
  }) => {
    await page.goto("/users");
    // The seeded admin row should not render a delete button
    await expect(
      page.getByRole("button", { name: "Delete Admin" }),
    ).not.toBeVisible();
  });
});
