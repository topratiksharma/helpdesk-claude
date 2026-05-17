import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { useSession } from '@/lib/auth-client'
import { ReplyForm } from './ReplyForm'
import { renderWithProviders } from '@/test/utils'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

// ─── Typed mocks ──────────────────────────────────────────────────────────────

const mockedAxios = vi.mocked(axios)
const mockedUseSession = vi.mocked(useSession)

const agentSession = {
  data: { user: { id: 'u1', name: 'Agent', email: 'agent@test.com', role: 'agent' } },
  isPending: false,
}

const adminSession = {
  data: { user: { id: 'u2', name: 'Admin', email: 'admin@test.com', role: 'admin' } },
  isPending: false,
}

const customerSession = {
  data: { user: { id: 'u3', name: 'Customer', email: 'c@test.com', role: 'customer' } },
  isPending: false,
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ReplyForm — rendering', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
  })

  it('renders the reply textarea', () => {
    renderWithProviders(<ReplyForm ticketId={1} />)
    expect(screen.getByPlaceholderText(/write a reply/i)).toBeInTheDocument()
  })

  it('renders the Send reply button', () => {
    renderWithProviders(<ReplyForm ticketId={1} />)
    expect(screen.getByRole('button', { name: /send reply/i })).toBeInTheDocument()
  })

  it('renders the Reply section label', () => {
    renderWithProviders(<ReplyForm ticketId={1} />)
    expect(screen.getByText(/^reply$/i)).toBeInTheDocument()
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('ReplyForm — validation', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
  })

  it('shows a validation error when submitting with an empty body', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByText(/reply cannot be empty/i)).toBeInTheDocument()
  })

  it('does not call POST when body is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await screen.findByText(/reply cannot be empty/i)
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })
})

// ─── Submission ───────────────────────────────────────────────────────────────

describe('ReplyForm — submission', () => {
  beforeEach(() => {
    mockedAxios.post.mockResolvedValue({ data: {} })
  })

  it('POSTs to the correct endpoint with body and sender=agent for an agent session', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={7} />)
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Here is my reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/tickets/7/messages',
        { body: 'Here is my reply', sender: 'agent' },
        { withCredentials: true },
      ),
    )
  })

  it('POSTs with sender=agent for an admin session', async () => {
    mockedUseSession.mockReturnValue(adminSession as ReturnType<typeof useSession>)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Admin reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/tickets/1/messages',
        { body: 'Admin reply', sender: 'agent' },
        { withCredentials: true },
      ),
    )
  })

  it('POSTs with sender=customer for a non-agent/admin session', async () => {
    mockedUseSession.mockReturnValue(customerSession as ReturnType<typeof useSession>)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Customer reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/tickets/1/messages',
        { body: 'Customer reply', sender: 'customer' },
        { withCredentials: true },
      ),
    )
  })

  it('clears the textarea after a successful submission', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    const textarea = screen.getByPlaceholderText(/write a reply/i)
    await user.type(textarea, 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() => expect(textarea).toHaveValue(''))
  })

  it('shows "Sending…" on the button while the mutation is in flight', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.post.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByRole('button', { name: /sending/i })).toBeDisabled()
  })
})

// ─── Error handling ───────────────────────────────────────────────────────────

describe('ReplyForm — error handling', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
  })

  it('shows the API error message when the POST returns an error', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { error: 'Failed to send reply.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to send reply/i)
  })

  it('shows a fallback error message for non-axios errors', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network failure'))
    mockedAxios.isAxiosError.mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to send reply/i)
  })

  it('keeps the textarea value after a failed submission', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Server error'))
    mockedAxios.isAxiosError.mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<ReplyForm ticketId={1} />)
    const textarea = screen.getByPlaceholderText(/write a reply/i)
    await user.type(textarea, 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await screen.findByRole('alert')
    expect(textarea).toHaveValue('Test reply')
  })
})
