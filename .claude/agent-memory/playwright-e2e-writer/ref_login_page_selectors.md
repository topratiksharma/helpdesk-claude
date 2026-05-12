---
name: Login page selectors
description: Stable locators for LoginPage.tsx fields, validation errors, and the server-error alert
type: reference
---

## LoginPage.tsx (`client/src/pages/LoginPage.tsx`)

| Element | Locator |
|---|---|
| Email input | `page.locator("#email")` |
| Password input | `page.locator("#password")` |
| Submit button | `page.getByRole("button", { name: "Sign in" })` |
| Client-side field error | `page.getByText("<zod message>")` — rendered as `<span class="text-xs text-destructive">` below the field |
| Server/auth error banner | `page.getByRole("alert")` — rendered as `<div role="alert">` containing the Better Auth error message |

## Zod validation messages
- Empty or invalid email: `"Please enter a valid email address"`
- Empty password: `"Password is required"`

## Important: `noValidate` on the `<form>` tag
The form has `noValidate` so the browser's native validation is suppressed. All field errors come from zod/react-hook-form and are rendered as `<span>` elements. The `role="alert"` div only appears for server-returned errors (wrong credentials, etc.).

## Route: `/login`
Public route. Renders `<Navigate to="/" replace />` immediately if a valid session already exists (`!isPending && session`).
