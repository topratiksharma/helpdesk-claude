import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsersTable } from './UsersTable'
import { renderWithProviders } from '@/test/utils'
import { type User } from './users.types'

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    role: 'agent',
    createdAt: '2024-02-20T00:00:00Z',
  },
]

const onDelete = vi.fn()
const onEdit = vi.fn()

function renderTable(overrides: Partial<Parameters<typeof UsersTable>[0]> = {}) {
  return renderWithProviders(
    <UsersTable
      users={mockUsers}
      loading={false}
      currentUserId="other-user-id"
      onDelete={onDelete}
      onEdit={onEdit}
      {...overrides}
    />,
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('UsersTable — loading state', () => {
  it('shows 5 skeleton rows while loading', () => {
    renderTable({ loading: true })
    const rows = screen.getAllByRole('row')
    // 1 header + 5 skeleton rows
    expect(rows).toHaveLength(6)
  })

  it('does not render user data while loading', () => {
    renderTable({ loading: true })
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('UsersTable — empty state', () => {
  it('shows empty message when users array is empty', () => {
    renderTable({ users: [] })
    expect(screen.getByText(/no users yet/i)).toBeInTheDocument()
  })

  it('does not render a table when users array is empty', () => {
    renderTable({ users: [] })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

// ─── Loaded state ─────────────────────────────────────────────────────────────

describe('UsersTable — loaded state', () => {
  it('renders a row for each user', () => {
    renderTable()
    const rows = screen.getAllByRole('row')
    // 1 header + 2 data rows
    expect(rows).toHaveLength(3)
  })

  it('renders user names', () => {
    renderTable()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('renders user email addresses', () => {
    renderTable()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('renders role badges for each user', () => {
    renderTable()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('agent')).toBeInTheDocument()
  })

  it('formats and renders the joined date', () => {
    renderTable()
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('Feb 20, 2024')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    renderTable()
    expect(screen.getByText(/name/i)).toBeInTheDocument()
    expect(screen.getByText(/email/i)).toBeInTheDocument()
    expect(screen.getByText(/role/i)).toBeInTheDocument()
    expect(screen.getByText(/date joined/i)).toBeInTheDocument()
  })
})

// ─── Delete button ────────────────────────────────────────────────────────────

describe('UsersTable — delete button', () => {
  it('enables delete button for agent users who are not the current user', () => {
    renderTable({ currentUserId: 'user-1' })
    expect(screen.getByRole('button', { name: /delete bob jones/i })).not.toBeDisabled()
  })

  it('disables delete button for the current user', () => {
    renderTable({ currentUserId: 'user-2' })
    expect(screen.getByRole('button', { name: /delete bob jones/i })).toBeDisabled()
  })

  it('hides delete button for admin users', () => {
    renderTable({ currentUserId: undefined })
    expect(screen.queryByRole('button', { name: /delete alice smith/i })).not.toBeInTheDocument()
  })

  it('does not disable delete button for agent users when currentUserId is undefined', () => {
    renderTable({ currentUserId: undefined })
    expect(screen.getByRole('button', { name: /delete bob jones/i })).not.toBeDisabled()
  })

  it('calls onDelete with the correct user when delete is clicked', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /delete bob jones/i }))
    expect(onDelete).toHaveBeenCalledWith(mockUsers[1])
  })
})

// ─── Edit button ──────────────────────────────────────────────────────────────

describe('UsersTable — edit button', () => {
  it('enables edit button for all users including current user', () => {
    renderTable({ currentUserId: 'user-1' })
    expect(screen.getByRole('button', { name: /edit alice smith/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /edit bob jones/i })).not.toBeDisabled()
  })

  it('calls onEdit with the correct user when edit is clicked', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /edit alice smith/i }))
    expect(onEdit).toHaveBeenCalledWith(mockUsers[0])
  })

  it('calls onEdit with the correct user for each row', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /edit bob jones/i }))
    expect(onEdit).toHaveBeenCalledWith(mockUsers[1])
  })
})
