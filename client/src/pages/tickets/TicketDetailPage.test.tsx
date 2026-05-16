import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { useSession } from '@/lib/auth-client'
import TicketDetailPage from './TicketDetailPage'
import { renderWithProviders } from '@/test/utils'
import type { TicketDetailResponse } from './tickets.types'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

vi.mock('react-router', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => vi.fn(),
}))

// ─── Browser API polyfills required by Radix UI ───────────────────────────────

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn()
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
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
    mockedAxios.get.mockReturnValue(new Promise(() => {}))
  })

  it('shows skeleton while ticket is loading', () => {
    renderWithProviders(<TicketDetailPage />)
    expect(screen.queryByText('Login issue')).not.toBeInTheDocument()
  })
})

// ─── Error state ──────────────────────────────────────────────────────────────

describe('TicketDetailPage — error state', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(agentSession as ReturnType<typeof useSession>)
    mockedAxios.get.mockRejectedValue(new Error('Not found'))
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

  it('renders a Select dropdown for agent assignment', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toBeInTheDocument()
  })

  it('shows "Unassigned" as the default value when no agent is assigned', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toHaveTextContent(
      /unassigned/i,
    )
  })

  it('shows the assigned agent name as the selected value', async () => {
    setupAdminGet(assignedTicket)
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toHaveTextContent(
      /alice agent/i,
    )
  })

  it('lists all agents in the dropdown when opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Assigned agent' }))

    expect(await screen.findByRole('option', { name: 'Alice Agent' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bob Agent' })).toBeInTheDocument()
  })

  it('includes an "Unassigned" option in the dropdown', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Assigned agent' }))

    expect(await screen.findByRole('option', { name: /unassigned/i })).toBeInTheDocument()
  })

  it('calls PATCH with the agent id when an agent is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Assigned agent' }))
    await user.click(await screen.findByRole('option', { name: 'Alice Agent' }))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/1',
        { assignedToId: 'a1' },
        { withCredentials: true },
      )
    })
  })

  it('calls PATCH with null when "Unassigned" is selected', async () => {
    setupAdminGet(assignedTicket)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Assigned agent' }))
    await user.click(await screen.findByRole('option', { name: /^unassigned$/i }))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/1',
        { assignedToId: null },
        { withCredentials: true },
      )
    })
  })

  it('shows an error message when the assignment mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Assigned agent' }))
    await user.click(await screen.findByRole('option', { name: 'Alice Agent' }))

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

  it('renders a Select dropdown for category', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toBeInTheDocument()
  })

  it('shows "No category" when ticket category is null', async () => {
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toHaveTextContent(
      /no category/i,
    )
  })

  it('shows the current category name as the selected value', async () => {
    setupAdminGet(categorisedTicket)
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toHaveTextContent(
      /technical questions/i,
    )
  })

  it('lists all categories in the dropdown when opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Ticket category' }))

    expect(await screen.findByRole('option', { name: 'General Questions' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Technical Questions' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Refund' })).toBeInTheDocument()
  })

  it('includes a "No category" option in the dropdown', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Ticket category' }))

    expect(await screen.findByRole('option', { name: /no category/i })).toBeInTheDocument()
  })

  it('calls PATCH with the category value when a category is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Ticket category' }))
    await user.click(await screen.findByRole('option', { name: 'Technical Questions' }))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/1',
        { category: 'technical_questions' },
        { withCredentials: true },
      )
    })
  })

  it('calls PATCH with null when "No category" is selected', async () => {
    setupAdminGet(categorisedTicket)
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Ticket category' }))
    await user.click(await screen.findByRole('option', { name: /^no category$/i }))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/1',
        { category: null },
        { withCredentials: true },
      )
    })
  })

  it('shows an error message when the category mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderWithProviders(<TicketDetailPage />)
    await screen.findByText('Login issue')

    await user.click(screen.getByRole('combobox', { name: 'Ticket category' }))
    await user.click(await screen.findByRole('option', { name: 'Refund' }))

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
    expect(screen.getByText('Technical Questions')).toBeInTheDocument()
  })
})
