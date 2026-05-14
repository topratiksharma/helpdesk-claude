import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Navbar from './Navbar'
import { renderWithProviders } from '@/test/utils'

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { useSession, signOut } from '@/lib/auth-client'
const mockedUseSession = vi.mocked(useSession)
const mockedSignOut = vi.mocked(signOut)

function renderNavbar(role: 'admin' | 'agent' = 'admin') {
  mockedUseSession.mockReturnValue({
    data: { user: { id: 'u1', name: 'Test User', email: 'test@example.com', role } },
    isPending: false,
  } as ReturnType<typeof useSession>)
  return renderWithProviders(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedSignOut.mockResolvedValue(undefined as never)
})

// ─── Role-based nav links ─────────────────────────────────────────────────────

describe('Navbar — role-based links', () => {
  it('shows the Users nav link for admin users', () => {
    renderNavbar('admin')
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument()
  })

  it('does not show the Users nav link for agent users', () => {
    renderNavbar('agent')
    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument()
  })

  it('shows the Tickets nav link for all users', () => {
    renderNavbar('agent')
    expect(screen.getByRole('link', { name: /tickets/i })).toBeInTheDocument()
  })

  it('shows the Dashboard nav link for all users', () => {
    renderNavbar('agent')
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })
})

// ─── User info ────────────────────────────────────────────────────────────────

describe('Navbar — user info', () => {
  it('renders the logged-in user name', () => {
    renderNavbar()
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})

// ─── Sign out ─────────────────────────────────────────────────────────────────

describe('Navbar — sign out', () => {
  it('calls signOut when the sign-out button is clicked', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockedSignOut).toHaveBeenCalled()
  })
})
