import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import LoginPage from './LoginPage'
import { renderWithProviders } from '@/test/utils'

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
  signIn: { email: vi.fn() },
}))

import { useSession, signIn } from '@/lib/auth-client'
const mockedUseSession = vi.mocked(useSession)
const mockedSignIn = vi.mocked(signIn.email)

function renderLogin() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  )
}

function renderLoginWithRouter() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/', element: <div>Dashboard</div> },
    ],
    { initialEntries: ['/login'] },
  )
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
})

// ─── Client-side validation ───────────────────────────────────────────────────

describe('LoginPage — client-side validation', () => {
  it('shows email error when email field is empty', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/password/i), 'anything')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows email error when email format is invalid', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email address/i), 'notanemail')
    await user.type(screen.getByLabelText(/password/i), 'anything')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
  })

  it('shows password error when password field is empty', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email address/i), 'someone@example.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ─── Server error ─────────────────────────────────────────────────────────────

describe('LoginPage — server error', () => {
  it('shows alert banner when sign-in returns an error', async () => {
    mockedSignIn.mockResolvedValue({ error: { message: 'Invalid credentials. Please try again.' } } as Awaited<ReturnType<typeof signIn.email>>)
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email address/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i)
  })
})

// ─── Already authenticated ────────────────────────────────────────────────────

describe('LoginPage — already authenticated', () => {
  it('redirects to / when user already has a session', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'u1', name: 'Admin', email: 'admin@example.com' } },
      isPending: false,
    } as ReturnType<typeof useSession>)
    renderLoginWithRouter()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
