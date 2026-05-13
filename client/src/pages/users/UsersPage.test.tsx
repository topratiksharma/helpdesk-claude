import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import UsersPage from './UsersPage'
import { renderWithProviders } from '@/test/utils'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: { user: { id: 'current-user-id' } } }),
}))

const mockedAxios = vi.mocked(axios)

const mockUsers = [
  {
    id: 'user-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'admin' as const,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    role: 'agent' as const,
    createdAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'current-user-id',
    name: 'Me Admin',
    email: 'me@example.com',
    role: 'admin' as const,
    createdAt: '2024-03-01T00:00:00Z',
  },
]

// ─── Loading state ────────────────────────────────────────────────────────────

describe('UsersPage — loading state', () => {
  it('shows 5 skeleton rows while users are loading', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<UsersPage />)
    const rows = screen.getAllByRole('row')
    // 1 header row + 5 skeleton rows
    expect(rows).toHaveLength(6)
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })
})

// ─── Loaded state ─────────────────────────────────────────────────────────────

describe('UsersPage — loaded state', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } })
  })

  it('renders user names in the table', async () => {
    renderWithProviders(<UsersPage />)
    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('renders user email addresses', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders role badges for each user', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    expect(screen.getAllByText('admin')).toHaveLength(2)
    expect(screen.getAllByText('agent')).toHaveLength(1)
  })

  it('disables the delete button for the current user', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Me Admin')
    const rows = screen.getAllByRole('row')
    const myRow = rows.find((r) => r.textContent?.includes('Me Admin'))!
    expect(myRow.querySelector('button')).toBeDisabled()
  })

  it('enables delete buttons for other users', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find((r) => r.textContent?.includes('Alice Smith'))!
    expect(aliceRow.querySelector('button')).not.toBeDisabled()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('UsersPage — empty state', () => {
  it('shows empty message when no users exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [] } })
    renderWithProviders(<UsersPage />)
    expect(await screen.findByText(/no users yet/i)).toBeInTheDocument()
  })
})

// ─── Error state ──────────────────────────────────────────────────────────────

describe('UsersPage — error state', () => {
  it('shows error banner when the fetch fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<UsersPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load users/i)
  })
})

// ─── Add user dialog ──────────────────────────────────────────────────────────

describe('UsersPage — add user dialog', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } })
  })

  it('opens the dialog when "Add user" is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /add user/i })).toBeInTheDocument()
  })

  it('shows validation errors when form is submitted empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
  })

  it('shows name length error when name is too short', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), 'AB')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('shows name error when name is whitespace only', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), '   ')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('shows password error when password contains spaces', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'pass word1')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByText(/must not contain spaces/i)).toBeInTheDocument()
  })

  it('shows password length error for short password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('closes the dialog and refetches on successful creation', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValue({})
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), 'New User')
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({ name: 'New User', email: 'new@example.com' }),
      expect.any(Object),
    )
  })

  it('shows server error inside dialog when creation fails', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockRejectedValue({ response: { data: { error: 'Email already taken.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), 'New User')
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email already taken.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

// ─── Delete user ──────────────────────────────────────────────────────────────

describe('UsersPage — delete user', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('calls the delete API when deletion is confirmed', async () => {
    const user = userEvent.setup()
    mockedAxios.delete.mockResolvedValue({})
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find((r) => r.textContent?.includes('Alice Smith'))!
    await user.click(aliceRow.querySelector('button')!)
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Alice Smith'))
    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/users/user-1', expect.any(Object)),
    )
  })

  it('does not call the delete API when deletion is cancelled', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find((r) => r.textContent?.includes('Alice Smith'))!
    await user.click(aliceRow.querySelector('button')!)
    expect(mockedAxios.delete).not.toHaveBeenCalled()
  })

  it('shows error banner when delete fails', async () => {
    const user = userEvent.setup()
    mockedAxios.delete.mockRejectedValue({ response: { data: { error: 'Cannot delete this user.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find((r) => r.textContent?.includes('Alice Smith'))!
    await user.click(aliceRow.querySelector('button')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot delete this user.')
  })
})
