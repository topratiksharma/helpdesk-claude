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

function renderTable(overrides: Partial<Parameters<typeof UsersTable>[0]> = {}) {
  return renderWithProviders(
    <UsersTable
      users={mockUsers}
      loading={false}
      currentUserId="other-user-id"
      onDelete={onDelete}
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
  it('enables delete button for users other than the current user', () => {
    renderTable({ currentUserId: 'user-1' })
    const rows = screen.getAllByRole('row')
    const bobRow = rows.find((r) => r.textContent?.includes('Bob Jones'))!
    expect(bobRow.querySelector('button')).not.toBeDisabled()
  })

  it('disables delete button for the current user', () => {
    renderTable({ currentUserId: 'user-1' })
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find((r) => r.textContent?.includes('Alice Smith'))!
    expect(aliceRow.querySelector('button')).toBeDisabled()
  })

  it('disables all delete buttons when currentUserId is undefined', () => {
    renderTable({ currentUserId: undefined })
    const rows = screen.getAllByRole('row').slice(1)
    rows.forEach((row) => expect(row.querySelector('button')).not.toBeDisabled())
  })

  it('calls onDelete with the correct user when delete is clicked', async () => {
    const user = userEvent.setup()
    renderTable()
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find((r) => r.textContent?.includes('Alice Smith'))!
    await user.click(aliceRow.querySelector('button')!)
    expect(onDelete).toHaveBeenCalledWith(mockUsers[0])
  })

  it('calls onDelete with the correct user for each row', async () => {
    const user = userEvent.setup()
    renderTable()
    const rows = screen.getAllByRole('row')
    const bobRow = rows.find((r) => r.textContent?.includes('Bob Jones'))!
    await user.click(bobRow.querySelector('button')!)
    expect(onDelete).toHaveBeenCalledWith(mockUsers[1])
  })
})
