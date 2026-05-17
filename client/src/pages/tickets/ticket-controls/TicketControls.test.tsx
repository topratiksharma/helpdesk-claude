import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { TicketControls } from './TicketControls'
import { renderWithProviders } from '@/test/utils'
import type { TicketDetail, AgentListItem } from '../tickets.types'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('axios', () => ({
  default: {
    patch: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

// Replace shadcn/ui Select with a native <select> so jsdom can interact with it.
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const agents: AgentListItem[] = [
  { id: 'a1', name: 'Alice Agent', email: 'alice@example.com' },
  { id: 'a2', name: 'Bob Agent', email: 'bob@example.com' },
]

const baseTicket: TicketDetail = {
  id: 1,
  subject: 'Login issue',
  fromName: 'John Customer',
  fromEmail: 'john@example.com',
  status: 'open',
  category: null,
  assignedToId: null,
  assignedTo: null,
  messages: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T12:00:00Z',
}

function renderControls(overrides: Partial<TicketDetail> = {}, isAdmin = true) {
  const ticket = { ...baseTicket, ...overrides }
  return renderWithProviders(
    <TicketControls ticketId="1" ticket={ticket} isAdmin={isAdmin} agents={isAdmin ? agents : []} />,
  )
}

// ─── From section ─────────────────────────────────────────────────────────────

describe('TicketControls — From section', () => {
  it('renders the sender name', () => {
    renderControls()
    expect(screen.getByText('John Customer')).toBeInTheDocument()
  })

  it('renders the sender email', () => {
    renderControls()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})

// ─── Status ───────────────────────────────────────────────────────────────────

describe('TicketControls — status', () => {
  beforeEach(() => {
    mockedAxios.patch.mockResolvedValue({ data: {} })
  })

  it('renders the status select with the current value', () => {
    renderControls({ status: 'open' })
    expect(screen.getByRole('combobox', { name: 'Ticket status' })).toHaveValue('open')
  })

  it('lists all status options', () => {
    renderControls()
    const select = screen.getByRole('combobox', { name: 'Ticket status' })
    expect(within(select).getByRole('option', { name: 'Open' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Resolved' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Closed' })).toBeInTheDocument()
  })

  it('calls PATCH with the new status when changed', async () => {
    const user = userEvent.setup()
    renderControls({ status: 'open' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket status' }), 'resolved')
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { status: 'resolved' },
      { withCredentials: true },
    )
  })

  it('shows an inline error when the status mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderControls()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket status' }), 'closed')
    expect(await screen.findByText(/failed to update/i)).toBeInTheDocument()
  })
})

// ─── Category — admin ─────────────────────────────────────────────────────────

describe('TicketControls — category (admin)', () => {
  beforeEach(() => {
    mockedAxios.patch.mockResolvedValue({ data: {} })
  })

  it('renders the category select defaulting to "none" when category is null', () => {
    renderControls({ category: null })
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toHaveValue('none')
  })

  it('renders the category select with the current category', () => {
    renderControls({ category: 'refund' })
    expect(screen.getByRole('combobox', { name: 'Ticket category' })).toHaveValue('refund')
  })

  it('lists all category options', () => {
    renderControls()
    const select = screen.getByRole('combobox', { name: 'Ticket category' })
    expect(within(select).getByRole('option', { name: 'No category' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'General' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Technical' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Refund' })).toBeInTheDocument()
  })

  it('calls PATCH with the selected category', async () => {
    const user = userEvent.setup()
    renderControls()
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
    const user = userEvent.setup()
    renderControls({ category: 'refund' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket category' }), 'none')
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { category: null },
      { withCredentials: true },
    )
  })

  it('shows an inline error when the category mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderControls()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ticket category' }), 'refund')
    expect(await screen.findByText(/failed to update/i)).toBeInTheDocument()
  })
})

// ─── Category — non-admin ─────────────────────────────────────────────────────

describe('TicketControls — category (non-admin)', () => {
  it('shows "—" when category is null', () => {
    renderControls({ category: null }, false)
    expect(screen.queryByRole('combobox', { name: 'Ticket category' })).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the category label as plain text', () => {
    renderControls({ category: 'technical_questions' }, false)
    expect(screen.getByText('Technical')).toBeInTheDocument()
  })
})

// ─── Assignment — admin ───────────────────────────────────────────────────────

describe('TicketControls — assignment (admin)', () => {
  beforeEach(() => {
    mockedAxios.patch.mockResolvedValue({ data: {} })
  })

  it('defaults to "unassigned" when no agent is assigned', () => {
    renderControls({ assignedTo: null })
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toHaveValue('unassigned')
  })

  it('shows the currently assigned agent as the selected value', () => {
    renderControls({ assignedTo: { id: 'a1', name: 'Alice Agent', email: 'alice@example.com' } })
    expect(screen.getByRole('combobox', { name: 'Assigned agent' })).toHaveValue('a1')
  })

  it('lists all agents plus Unassigned', () => {
    renderControls()
    const select = screen.getByRole('combobox', { name: 'Assigned agent' })
    expect(within(select).getByRole('option', { name: 'Unassigned' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Alice Agent' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Bob Agent' })).toBeInTheDocument()
  })

  it('calls PATCH with the agent id when an agent is selected', async () => {
    const user = userEvent.setup()
    renderControls()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Assigned agent' }), 'a2')
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/api/tickets/1',
      { assignedToId: 'a2' },
      { withCredentials: true },
    )
  })

  it('calls PATCH with null when "Unassigned" is selected', async () => {
    const user = userEvent.setup()
    renderControls({ assignedTo: { id: 'a1', name: 'Alice Agent', email: 'alice@example.com' } })
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

  it('shows an inline error when the assignment mutation fails', async () => {
    mockedAxios.patch.mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()
    renderControls()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Assigned agent' }), 'a1')
    expect(await screen.findByText(/failed to update/i)).toBeInTheDocument()
  })
})

// ─── Assignment — non-admin ───────────────────────────────────────────────────

describe('TicketControls — assignment (non-admin)', () => {
  it('shows "Unassigned" as plain text when no agent is assigned', () => {
    renderControls({ assignedTo: null }, false)
    expect(screen.queryByRole('combobox', { name: 'Assigned agent' })).not.toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('shows the assigned agent name as plain text', () => {
    renderControls(
      { assignedTo: { id: 'a1', name: 'Alice Agent', email: 'alice@example.com' } },
      false,
    )
    expect(screen.getByText('Alice Agent')).toBeInTheDocument()
  })
})
