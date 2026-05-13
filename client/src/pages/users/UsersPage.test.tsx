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
    patch: vi.fn(),
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

  it('hides delete button and shows edit button for the current admin user', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Me Admin')
    expect(screen.queryByRole('button', { name: /delete me admin/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit me admin/i })).toBeInTheDocument()
  })

  it('enables delete button for agent users', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Bob Jones')
    expect(screen.getByRole('button', { name: /delete bob jones/i })).not.toBeDisabled()
  })

  it('hides delete button for admin users', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    expect(screen.queryByRole('button', { name: /delete alice smith/i })).not.toBeInTheDocument()
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

  it('shows duplicate error when email exists with different casing', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'A user with that email already exists.' } },
    })
    mockedAxios.isAxiosError.mockReturnValue(true)
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.type(screen.getByLabelText(/^name/i), 'New User')
    await user.type(screen.getByLabelText(/email address/i), 'ALICE@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the dialog when the close button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes the dialog when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /add user/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

// ─── Delete user ──────────────────────────────────────────────────────────────

describe('UsersPage — delete user', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } })
  })

  it('opens a confirmation dialog when delete is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Bob Jones')
    await user.click(screen.getByRole('button', { name: /delete bob jones/i }))
    expect(screen.getByText(/delete bob jones\?/i)).toBeInTheDocument()
    expect(screen.getByText(/revoke their access/i)).toBeInTheDocument()
  })

  it('calls the delete API when deletion is confirmed in the dialog', async () => {
    const user = userEvent.setup()
    mockedAxios.delete.mockResolvedValue({})
    renderWithProviders(<UsersPage />)
    await screen.findByText('Bob Jones')
    await user.click(screen.getByRole('button', { name: /delete bob jones/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/users/user-2', expect.any(Object)),
    )
  })

  it('does not call the delete API when deletion is cancelled', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await screen.findByText('Bob Jones')
    await user.click(screen.getByRole('button', { name: /delete bob jones/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockedAxios.delete).not.toHaveBeenCalled()
  })

  it('closes the dialog after confirming deletion', async () => {
    const user = userEvent.setup()
    mockedAxios.delete.mockResolvedValue({})
    renderWithProviders(<UsersPage />)
    await screen.findByText('Bob Jones')
    await user.click(screen.getByRole('button', { name: /delete bob jones/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText(/delete bob jones\?/i)).not.toBeInTheDocument())
  })

  it('shows error banner when delete fails', async () => {
    const user = userEvent.setup()
    mockedAxios.delete.mockRejectedValue({ response: { data: { error: 'Cannot delete this user.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    renderWithProviders(<UsersPage />)
    await screen.findByText('Bob Jones')
    await user.click(screen.getByRole('button', { name: /delete bob jones/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot delete this user.')
  })
})
