import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { TicketsTable } from './TicketsTable'

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}))
import { renderWithProviders } from '@/test/utils'
import { type TicketListItem } from './tickets.types'

const mockTickets: TicketListItem[] = [
  {
    id: 101,
    subject: 'Cannot access my account',
    fromEmail: 'alice@example.com',
    fromName: 'Alice Customer',
    status: 'open',
    category: 'technical_questions',
    assignedToId: null,
    assignedTo: null,
    _count: { messages: 3 },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 102,
    subject: 'Request a refund',
    fromEmail: 'bob@example.com',
    fromName: 'Bob Customer',
    status: 'resolved',
    category: 'refund',
    assignedToId: null,
    assignedTo: null,
    _count: { messages: 7 },
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 103,
    subject: 'General inquiry',
    fromEmail: 'carol@example.com',
    fromName: 'Carol Customer',
    status: 'closed',
    category: null,
    assignedToId: null,
    assignedTo: null,
    _count: { messages: 4 },
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
]

function renderTable(overrides: Partial<Parameters<typeof TicketsTable>[0]> = {}) {
  return renderWithProviders(
    <TicketsTable
      tickets={mockTickets}
      loading={false}
      sorting={[]}
      onSortingChange={() => {}}
      {...overrides}
    />,
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('TicketsTable — loading state', () => {
  it('shows 5 skeleton rows while loading', () => {
    renderTable({ loading: true })
    const rows = screen.getAllByRole('row')
    // 1 header + 5 skeleton rows
    expect(rows).toHaveLength(6)
  })

  it('does not render ticket data while loading', () => {
    renderTable({ loading: true })
    expect(screen.queryByText('Cannot access my account')).not.toBeInTheDocument()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('TicketsTable — empty state', () => {
  it('shows empty message when tickets array is empty', () => {
    renderTable({ tickets: [] })
    expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument()
  })

  it('does not render a table when tickets array is empty', () => {
    renderTable({ tickets: [] })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

// ─── Loaded state ─────────────────────────────────────────────────────────────

describe('TicketsTable — loaded state', () => {
  it('renders a row for each ticket', () => {
    renderTable()
    const rows = screen.getAllByRole('row')
    // 1 header + 3 data rows
    expect(rows).toHaveLength(4)
  })

  it('renders ticket subjects', () => {
    renderTable()
    expect(screen.getByText('Cannot access my account')).toBeInTheDocument()
    expect(screen.getByText('Request a refund')).toBeInTheDocument()
    expect(screen.getByText('General inquiry')).toBeInTheDocument()
  })

  it('renders ticket ids', () => {
    renderTable()
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('102')).toBeInTheDocument()
    expect(screen.getByText('103')).toBeInTheDocument()
  })

  it('renders sender name and email for each ticket', () => {
    renderTable()
    expect(screen.getByText('Alice Customer')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Customer')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    renderTable()
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('resolved')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
  })

  it('renders human-readable category labels', () => {
    renderTable()
    expect(screen.getByText('Technical Questions')).toBeInTheDocument()
    expect(screen.getByText('Refund')).toBeInTheDocument()
  })

  it('renders — for tickets with no category', () => {
    renderTable()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('formats and renders the updated date', () => {
    renderTable()
    expect(screen.getAllByText('Jan 15, 2024').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Feb 20, 2024').length).toBeGreaterThan(0)
  })

  it('renders column headers', () => {
    renderTable()
    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
    expect(screen.getByText(/from/i)).toBeInTheDocument()
    expect(screen.getByText(/status/i)).toBeInTheDocument()
    expect(screen.getByText(/category/i)).toBeInTheDocument()
    expect(screen.getByText(/updated/i)).toBeInTheDocument()
  })
})
