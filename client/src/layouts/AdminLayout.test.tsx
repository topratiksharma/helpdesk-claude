import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import AdminLayout from './AdminLayout'

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

import { useSession } from '@/lib/auth-client'
const mockedUseSession = vi.mocked(useSession)

function renderAdmin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AdminLayout />,
        children: [{ index: true, element: <div>Admin Content</div> }],
      },
      { path: '/dashboard', element: <div>Dashboard</div> },
    ],
    { initialEntries: ['/'] },
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

// ─── Non-admin ────────────────────────────────────────────────────────────────

describe('AdminLayout — non-admin', () => {
  it('redirects to / when user is an agent', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'u1', name: 'Agent', email: 'agent@example.com', role: 'agent' } },
      isPending: false,
    } as ReturnType<typeof useSession>)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const router = createMemoryRouter(
      [
        { path: '/', element: <div>Home</div> },
        {
          path: '/admin',
          element: <AdminLayout />,
          children: [{ index: true, element: <div>Admin Content</div> }],
        },
      ],
      { initialEntries: ['/admin'] },
    )
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('redirects to / when there is no session', () => {
    renderAdmin()
    // No session means session?.user.role is undefined, not 'admin' → redirects
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })
})

// ─── Admin ────────────────────────────────────────────────────────────────────

describe('AdminLayout — admin', () => {
  it('renders the outlet when user is admin', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'u1', name: 'Admin', email: 'admin@example.com', role: 'admin' } },
      isPending: false,
    } as ReturnType<typeof useSession>)
    renderAdmin()
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})
