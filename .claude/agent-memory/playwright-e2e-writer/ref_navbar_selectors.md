---
name: Navbar selectors
description: Stable locators for Navbar.tsx — nav links, user name, and sign-out button
type: reference
---

## Navbar.tsx (`client/src/components/Navbar.tsx`)

| Element | Locator |
|---|---|
| Dashboard nav link | `page.getByRole("link", { name: "Dashboard" })` — always visible when authenticated |
| Users nav link | `page.getByRole("link", { name: "Users" })` — only visible when `user.role === 'admin'` |
| User name display | `page.getByText(user.name)` — rendered as a `<span>` in the right section of the header |
| Sign out button | `page.getByRole("button", { name: "Sign out" })` — ghost variant button, calls `signOut()` then `navigate("/login")` |

## Role conditional
```tsx
{user.role === Role.admin && (
  <NavLink to="/users">Users</NavLink>
)}
```
Agents will have `not.toBeVisible()` for the Users link. Use `await expect(link).not.toBeVisible()` (not `toBeHidden()`) to handle the case where the element is not in the DOM at all.

## Navbar only renders inside ProtectedLayout
The `<Navbar>` is rendered by `ProtectedLayout`, not at the app root. It will never appear on `/login`.
