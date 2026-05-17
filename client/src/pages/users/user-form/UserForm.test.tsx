import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { UserForm } from './UserForm'
import { renderWithProviders } from '@/test/utils'
import { type User } from './users.types'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

const mockedAxios = vi.mocked(axios)

const onSuccess = vi.fn()

const mockUser: User = {
  id: 'user-1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'admin',
  createdAt: '2024-01-15T00:00:00Z',
}

function renderForm() {
  return renderWithProviders(<UserForm onSuccess={onSuccess} />)
}

function renderEditForm(user = mockUser) {
  return renderWithProviders(<UserForm onSuccess={onSuccess} user={user} />)
}

beforeEach(() => {
  onSuccess.mockReset()
})

async function fillAndSubmit(name: string, email: string, password: string) {
  const user = userEvent.setup()
  renderForm()
  if (name) await user.type(screen.getByLabelText(/^name/i), name)
  if (email) await user.type(screen.getByLabelText(/email address/i), email)
  if (password) await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole('button', { name: /create user/i }))
  return user
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('UserForm — rendering', () => {
  it('renders name, email, password fields and submit button', () => {
    renderForm()
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
  })

  it('submit button is enabled by default', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /create user/i })).not.toBeDisabled()
  })
})

// ─── Name validation ──────────────────────────────────────────────────────────

describe('UserForm — name validation', () => {
  it('shows error when name is empty', async () => {
    await fillAndSubmit('', 'test@example.com', 'password123')
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('shows error when name is too short', async () => {
    await fillAndSubmit('AB', 'test@example.com', 'password123')
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('shows error when name is whitespace only', async () => {
    await fillAndSubmit('   ', 'test@example.com', 'password123')
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('does not show name error for a valid name', async () => {
    mockedAxios.post.mockResolvedValue({})
    await fillAndSubmit('Jane Smith', 'test@example.com', 'password123')
    await waitFor(() => expect(screen.queryByText(/at least 3 characters/i)).not.toBeInTheDocument())
  })
})

// ─── Email validation ─────────────────────────────────────────────────────────

describe('UserForm — email validation', () => {
  it('shows error when email is empty', async () => {
    await fillAndSubmit('Jane Smith', '', 'password123')
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
  })

  it('shows error when email format is invalid', async () => {
    await fillAndSubmit('Jane Smith', 'not-an-email', 'password123')
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
  })

  it('does not show email error for a valid email', async () => {
    mockedAxios.post.mockResolvedValue({})
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    await waitFor(() => expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument())
  })
})

// ─── Password validation ──────────────────────────────────────────────────────

describe('UserForm — password validation', () => {
  it('shows error when password is too short', async () => {
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'short')
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows error when password contains spaces', async () => {
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'pass word1')
    expect(await screen.findByText(/must not contain spaces/i)).toBeInTheDocument()
  })

  it('does not show password error for a valid password', async () => {
    mockedAxios.post.mockResolvedValue({})
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    await waitFor(() => expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument())
  })
})

// ─── Submission ───────────────────────────────────────────────────────────────

describe('UserForm — submission', () => {
  it('calls POST /api/users with correct payload', async () => {
    mockedAxios.post.mockResolvedValue({})
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/users',
        { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' },
        expect.any(Object),
      ),
    )
  })

  it('calls onSuccess after successful submission', async () => {
    mockedAxios.post.mockResolvedValue({})
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('does not call onSuccess when submission fails', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { error: 'Server error.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

// ─── API errors ───────────────────────────────────────────────────────────────

describe('UserForm — API errors', () => {
  it('shows error alert when API returns a message', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'A user with that email already exists.' } },
    })
    mockedAxios.isAxiosError.mockReturnValue(true)
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('shows duplicate error when email exists with different casing', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'A user with that email already exists.' } },
    })
    mockedAxios.isAxiosError.mockReturnValue(true)
    await fillAndSubmit('Jane Smith', 'JANE@example.com', 'password123')
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('shows fallback error when API returns no message', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: {} } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to create user/i)
  })

  it('shows fallback error for non-axios errors', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network failure'))
    mockedAxios.isAxiosError.mockReturnValue(false)
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to create user/i)
  })

  it('keeps the form visible after an API error', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'Something went wrong.' } },
    })
    mockedAxios.isAxiosError.mockReturnValue(true)
    await fillAndSubmit('Jane Smith', 'jane@example.com', 'password123')
    await screen.findByRole('alert')
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
  })
})

// ─── Edit mode — rendering ────────────────────────────────────────────────────

describe('UserForm (edit) — rendering', () => {
  it('pre-populates name and email from the user prop', () => {
    renderEditForm()
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice Smith')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('alice@example.com')
  })

  it('starts with an empty password field', () => {
    renderEditForm()
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
  })

  it('shows "Leave blank to keep current password" placeholder', () => {
    renderEditForm()
    expect(screen.getByPlaceholderText(/leave blank to keep current password/i)).toBeInTheDocument()
  })

  it('shows "Save changes" on the submit button', () => {
    renderEditForm()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})

// ─── Edit mode — password validation ─────────────────────────────────────────

describe('UserForm (edit) — password validation', () => {
  it('does not show password error when password is left blank', async () => {
    const user = userEvent.setup()
    mockedAxios.patch.mockResolvedValue({ data: { user: mockUser } })
    renderEditForm()
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalled())
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument()
  })

  it('shows error when a short password is entered', async () => {
    const user = userEvent.setup()
    renderEditForm()
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows error when password contains spaces', async () => {
    const user = userEvent.setup()
    renderEditForm()
    await user.type(screen.getByLabelText(/password/i), 'has spaces here')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByText(/must not contain spaces/i)).toBeInTheDocument()
  })
})

// ─── Edit mode — submission ───────────────────────────────────────────────────

describe('UserForm (edit) — submission', () => {
  it('calls PATCH /api/users/:id without password when password is blank', async () => {
    const user = userEvent.setup()
    mockedAxios.patch.mockResolvedValue({ data: { user: mockUser } })
    renderEditForm()
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalled())
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/users/user-1',
      { name: 'Alice Smith', email: 'alice@example.com' },
      { withCredentials: true },
    )
  })

  it('includes password in payload when password field is filled', async () => {
    const user = userEvent.setup()
    mockedAxios.patch.mockResolvedValue({ data: { user: mockUser } })
    renderEditForm()
    await user.type(screen.getByLabelText(/password/i), 'newsecret123')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalled())
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/users/user-1',
      { name: 'Alice Smith', email: 'alice@example.com', password: 'newsecret123' },
      { withCredentials: true },
    )
  })

  it('calls onSuccess after successful edit', async () => {
    const user = userEvent.setup()
    mockedAxios.patch.mockResolvedValue({ data: { user: mockUser } })
    renderEditForm()
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('shows error alert when API returns a conflict message', async () => {
    const user = userEvent.setup()
    mockedAxios.patch.mockRejectedValue({ response: { data: { error: 'A user with that email already exists.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    renderEditForm()
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('shows fallback error for non-axios errors during edit', async () => {
    const user = userEvent.setup()
    mockedAxios.patch.mockRejectedValue(new Error('Network failure'))
    mockedAxios.isAxiosError.mockReturnValue(false)
    renderEditForm()
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to update user/i)
  })
})
