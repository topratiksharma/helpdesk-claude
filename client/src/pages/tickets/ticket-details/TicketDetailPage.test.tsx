import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { useSession } from '@/lib/auth-client'
import TicketDetailPage from '../ticket-details/TicketDetailPage'
import { renderWithProviders } from '@/test/utils'
import type { TicketDetailResponse } from '../tickets.types'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

vi.mock('react-router', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', props, children),
}))

// Replace shadcn/ui Select with native <select> so jsdom can interact with it.
// SelectTrigger sets labelRef so SelectContent can apply aria-label to the <select>.
vi.mock('@/components/ui/select', async () => {
  const { createContext, useContext, useRef, createElement } = await import('react')
  type Ctx = {
    value: string
    onValueChange: (v: string) => void
    disabled?: boolean
    labelRef: { current: string }
  }
  const SelectCtx = createContext<Ctx | null>(null)

  function Select({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode
    value: string
    onValueChange: (v: string) => void
    disabled?: boolean
  }) {
    const labelRef = useRef('')
    return createElement(
      SelectCtx.Provider,
      { value: { value, onValueChange, disabled, labelRef } },
      children,
    )
  }

  function SelectTrigger({
    'aria-label': ariaLabel,
  }: {
    'aria-label'?: string
    [k: string]: unknown
  }) {
    const ctx = useContext(SelectCtx)
    if (ariaLabel && ctx) ctx.labelRef.current = ariaLabel
    return null
  }

  function SelectValue() {
    return null
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    const ctx = useContext(SelectCtx)!
    return createElement(
      'select',
      {
        'aria-label': ctx.labelRef.current,
        value: ctx.value,
        disabled: ctx.disabled,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => ctx.onValueChange(e.target.value),
      },
      children,
    )
  }

  function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return createElement('option', { value }, children)
  }

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

// ─── Browser API polyfills ────────────────────────────────────────────────────

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

// ─── Typed mocks ──────────────────────────────────────────────────────────────

const mockedAxios = vi.mocked(axios)
const mockedUseSession = vi.mocked(useSession)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const adminSession = {
  data: { user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' } },
  isPending: false,
}

const agentSession = {
  data: { user: { id: 'u2', name: 'Agent', email: 'agent@test.com', role: 'agent' } },
  isPending: false,
}

const mockAgents = {
  agents: [
    { id: 'a1', name: 'Alice Agent', email: 'alice@example.com' },
    { id: 'a2', name: 'Bob Agent', email: 'bob@example.com' },
  ],
}

const baseTicket = {
  id: 1,
  subject: 'Login issue',
  fromName: 'John Customer',
  fromEmail: 'john@example.com',
  status: 'open' as const,
  category: null,
  assignedToId: null,
  assignedTo: null,
  messages: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

const unassignedTicket: TicketDetailResponse = { ticket: { ...baseTicket } }

const assignedTicket: TicketDetailResponse = {
  ticket: {
    ...baseTicket,
    assignedToId: 'a1',
    assignedTo: { id: 'a1', name: 'Alice Agent', email: 'alice@example.com' },
  },
}

const categorisedTicket: TicketDetailResponse = {
  ticket: { ...baseTicket, category: 'technical_questions' as const },
}

// Make a 404 AxiosError so the query's retry function short-circuits immediately.
function make404Error() {
  const err = Object.assign(new Error('Not found'), { response: { status: 404 } })
  mockedAxios.isAxiosError.mockReturnValue(true)
  return err
}

function setupAdminGet(ticketResponse = unassignedTicket) {
  mockedAxios.get.mockImplementation((url: string) => {
    if ((url as string).includes('/api/agents')) return Promise.resolve({ data: mockAgents })
    return Promise.resolve({ data: ticketResponse })
  })
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('TicketDetailPage — loading state', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(adminSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockReturnValue(new Promise(() => { }))
  })

  it('does not render ticket content while loading', () => {
    renderWithProviders(<TicketDetailPage />)
    expect(screen.queryByText('Login issue')).not.toBeInTheDocument()
  })
})

// ─── Error state ──────────────────────────────────────────────────────────────

describe('TicketDetailPage — error state', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockRejectedValue(make404Error())
  })

  it('shows "Ticket not found" when the fetch fails', async () => {
    renderWithProviders(<TicketDetailPage />)
    expect(await screen.findByText(/ticket not found/i)).toBeInTheDocument()
  })
})

// ─── Ticket renders ───────────────────────────────────────────────────────────

describe('TicketDetailPage — ticket renders', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
  })

  it('renders the ticket subject', async () => {
    renderWithProviders(<TicketDetailPage />)
    expect(await screen.findByText('Login issue')).toBeInTheDocument()
  })

  it('renders the ticket status badge', async () => {
    renderWithProviders(<TicketDetailPage />)
    expect(await screen.findByText('open')).toBeInTheDocument()
  })

  it('renders the sender name and email', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByText(/John Customer/)).toBeInTheDocument()
    expect(screen.getByText(/john@example\.com/)).toBeInTheDocument()
  })

  it('shows "No messages yet" when the ticket has no messages', async () => {
    renderWithProviders(<TicketDetailPage />)
    expect(await screen.findByText(/no messages yet/i)).toBeInTheDocument()
  })
})

// ─── Agent assignment — admin ─────────────────────────────────────────────────

describe('TicketDetailPage — agent assignment (admin)', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(adminSession as ReturnType<typeof useSession>)
    setupAdminGet()
    mockedAxios.patch.mockResolvedValue({ data: {} })
  })

  it('renders a Select for agent assignment', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toBeInTheDocument()
  })

  it('defaults to "Unassigned" when no agent is assigned', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toHaveValue('unassigned')
  })

  it('shows the currently assigned agent as the selected value', async () => {
    setupAdminGet(assignedTicket)
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toHaveValue('a1')
  })

  it('lists all agents plus "Unassigned" as options', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    const select = screen.getByRole('combobox', { name: 'Assigned agent' })
    expect(within(select).getByRole('option', { name: 'Unassigned' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Alice Agent' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Bob Agent' })).toBeInTheDocument()
  })

  it('calls PATCH with the agent id when an agent is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Assigned agent' }), 'a1')

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { assignedToId: 'a1' },
      { withCredentials: true },
    )
  })

  it('calls PATCH with null when "Unassigned" is selected', async () => {
    setupAdminGet(assignedTicket)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Assigned agent' }),
      'unassigned',
    )

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { assignedToId: null },
      { withCredentials: true },
    )
  })

  it('shows an error message when the assignment mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Assigned agent' }), 'a1')

    expect(await screen.findByText(/failed to update/i)).toBeInTheDocument()
  })
})

// ─── Agent assignment — non-admin ─────────────────────────────────────────────

describe('TicketDetailPage — agent assignment (non-admin)', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
  })

  it('shows plain text instead of a Select for agent assignment', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.queryByRole('combobox', { name: 'Assigned agent' })).not.toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('shows the assigned agent name as plain text', async () => {
    mockedAxios.get.mockResolvedValue({ data: assignedTicket })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByText('Alice Agent')).toBeInTheDocument()
  })

  it('does not fetch agents for non-admin users', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(mockedAxios.get).not.toHaveBeenCalledWith('/api/agents', expect.anything())
  })
})

// ─── Category update — admin ──────────────────────────────────────────────────

describe('TicketDetailPage — category update (admin)', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(adminSession as ReturnType<typeof useSession>)
    setupAdminGet()
    mockedAxios.patch.mockResolvedValue({ data: {} })
  })

  it('renders a Select for ticket category', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toBeInTheDocument()
  })

  it('defaults to "none" when ticket category is null', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toHaveValue('none')
  })

  it('shows the current category as the selected value', async () => {
    setupAdminGet(categorisedTicket)
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toHaveValue(
      'technical_questions',
    )
  })

  it('lists all categories plus "No category" as options', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    const select = screen.getByRole('combobox', { name: 'Ticket category' })
    expect(within(select).getByRole('option', { name: 'No category' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'General' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Technical' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Refund' })).toBeInTheDocument()
  })

  it('calls PATCH with the category value when a category is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ticket category' }),
      'technical_questions',
    )

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { category: 'technical_questions' },
      { withCredentials: true },
    )
  })

  it('calls PATCH with null when "No category" is selected', async () => {
    setupAdminGet(categorisedTicket)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket category' }), 'none')

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { category: null },
      { withCredentials: true },
    )
  })

  it('shows an error message when the category mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ticket category' }),
      'refund',
    )

    expect(await screen.findByText(/failed to update/i)).toBeInTheDocument()
  })
})

// ─── Category update — non-admin ──────────────────────────────────────────────

// ─── Status update ────────────────────────────────────────────────────────────

describe('TicketDetailPage — status update', () => {
  // Status Select is visible to all authenticated users (agents + admins).

  it('renders a Select for ticket status (admin)', async () => {
    mockedUseSession.mockReturnValue(adminSession as ReturnType<typeof useSession>)
    setupAdminGet()
    mockedAxios.patch.mockResolvedValue({ data: {} })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket status' })).toBeInTheDocument()
  })

  it('renders a Select for ticket status (agent)', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    mockedAxios.patch.mockResolvedValue({ data: {} })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket status' })).toBeInTheDocument()
  })

  it('shows the current status as the selected value', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket status' })).toHaveValue('open')
  })

  it('lists all status options in the dropdown', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    const select = screen.getByRole('combobox', { name: 'Ticket status' })
    expect(within(select).getByRole('option', { name: 'Open' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Resolved' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Closed' })).toBeInTheDocument()
  })

  it('calls PATCH with the new status when changed', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    mockedAxios.patch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket status' }), 'resolved')

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { status: 'resolved' },
      { withCredentials: true },
    )
  })

  it('shows an error message when the status mutation fails', async () => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket status' }), 'closed')

    expect(await screen.findByText(/failed to update/i)).toBeInTheDocument()
  })
})

// ─── Category update — non-admin ──────────────────────────────────────────────

describe('TicketDetailPage — category update (non-admin)', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
  })

  it('shows plain text instead of a Select for category', async () => {
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.queryByRole('combobox', { name: 'Ticket category' })).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the category name as plain text when set', async () => {
    mockedAxios.get.mockResolvedValue({ data: categorisedTicket })
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByText('Technical')).toBeInTheDocument()
  })
})

// ─── Reply form ───────────────────────────────────────────────────────────────

describe('TicketDetailPage — reply form rendering', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
  })

  it('renders the reply textarea', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByPlaceholderText(/write a reply/i)).toBeInTheDocument()
  })

  it('renders the Send reply button', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('button', { name: /send reply/i })).toBeInTheDocument()
  })
})

describe('TicketDetailPage — reply form validation', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
  })

  it('shows a validation error when submitting an empty reply', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByText(/reply cannot be empty/i)).toBeInTheDocument()
  })

  it('does not call POST when the body is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await screen.findByText(/reply cannot be empty/i)
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })
})

describe('TicketDetailPage — reply form submission', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
    mockedAxios.post.mockResolvedValue({ data: {} })
  })

  it('calls POST /api/tickets/1/messages with body and sender=agent for an agent session', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/tickets/1/messages',
        { body: 'Test reply', sender: 'agent' },
        { withCredentials: true },
      ),
    )
  })

  it('calls POST with sender=customer for a non-agent/admin role', async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'c1', name: 'Customer', email: 'c@test.com', role: 'customer' } },
      isPending: false,
    } as ReturnType<typeof useSession>)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
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
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    const textarea = screen.getByPlaceholderText(/write a reply/i)
    await user.type(textarea, 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() => expect(textarea).toHaveValue(''))
  })
})

describe('TicketDetailPage — reply form errors', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: unassignedTicket })
  })

  it('shows an error alert when the POST returns an API error', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { error: 'Failed to send reply.' } } })
    mockedAxios.isAxiosError.mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to send reply/i)
  })

  it('shows a fallback error for non-axios errors', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network failure'))
    mockedAxios.isAxiosError.mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    await user.type(screen.getByPlaceholderText(/write a reply/i), 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to send reply/i)
  })

  it('keeps the textarea populated after a failed submission', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Server error'))
    mockedAxios.isAxiosError.mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    const textarea = screen.getByPlaceholderText(/write a reply/i)
    await user.type(textarea, 'Test reply')
    await user.click(screen.getByRole('button', { name: /send reply/i }))
    await screen.findByRole('alert')
    expect(textarea).toHaveValue('Test reply')
  })
})
