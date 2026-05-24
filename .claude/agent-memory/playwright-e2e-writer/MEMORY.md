# Playwright E2E Writer — Memory Index

- [Auth test patterns](ref_auth_test_patterns.md) — unauthenticated context, admin storageState, agent user creation, sign-up disabled assertion
- [Login page selectors](ref_login_page_selectors.md) — #email, #password, role=alert, destructive span, Sign in button
- [Navbar selectors](ref_navbar_selectors.md) — role=link Dashboard/Users, role=button Sign out, user name text
- [Agent user helper](ref_agent_user_helper.md) — e2e/helpers/create-user.ts, createTestUser/deleteTestUser, beforeAll/afterAll pattern
- [Users page selectors](ref_users_page_selectors.md) — Add/Edit/Delete dialog locators, validation messages, fixture patterns for CRUD tests
- [Webhook API test patterns](ref_webhook_api_tests.md) — API-level tests for inbound email webhook: auth, threading, idempotency, reopen, validation
- [Ticket detail page selectors](ref_ticket_detail_selectors.md) — reply form placeholder/button, status/category/assignment combobox aria-labels and option names, admin-only controls
- [Tickets list page selectors](ref_tickets_list_selectors.md) — status segmented control buttons, search input + 400ms debounce, empty state text, test data isolation strategy
- [Role access test patterns](ref_role_access_patterns.md) — agent login with try/finally ctx.close(), home page heading, AdminLayout redirect, admin smoke test via default session
