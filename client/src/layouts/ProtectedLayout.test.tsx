import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import ProtectedLayout from './ProtectedLayout'

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}))

import { useSession } from '@/lib/auth-client'
const mockedUseSession = vi.mocked(useSession)

function renderProtected(initialPath = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <ProtectedLayout />,
        children: [{ index: true, element: <div>Protected Content</div> }],
      },
      { path: '/login', element: <div>Login Page</div> },
    ],
    { initialEntries: [initialPath] },
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

// ─── Loading state ────────────────────────────────────────────────────────────

describe('ProtectedLayout — loading state', () => {
  it('shows loading spinner while session is pending', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as ReturnType<typeof useSession>)
    renderProtected()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})

// ─── Unauthenticated ──────────────────────────────────────────────────────────

describe('ProtectedLayout — unauthenticated', () => {
  it('redirects to /login when there is no session', () => {
    renderProtected()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})

// ─── Authenticated ────────────────────────────────────────────────────────────

describe('ProtectedLayout — authenticated', () => {
  it('renders the outlet when session exists', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'u1', name: 'Admin', email: 'admin@example.com', role: 'admin' } },
      isPending: false,
    } as ReturnType<typeof useSession>)
    renderProtected()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
