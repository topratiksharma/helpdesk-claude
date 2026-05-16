import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import axios from 'axios'
import TicketsPage from './TicketsPage'
import { renderWithProviders } from '@/test/utils'
import { type TicketsResponse } from './tickets.types'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const mockedAxios = vi.mocked(axios)

const mockResponse: TicketsResponse = {
  tickets: [
    {
      id: 1,
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
      id: 2,
      subject: 'Request a refund',
      fromEmail: 'bob@example.com',
      fromName: 'Bob Customer',
      status: 'resolved',
      category: 'refund',
      assignedToId: null,
      assignedTo: null,
      _count: { messages: 5 },
      createdAt: '2024-02-20T00:00:00Z',
      updatedAt: '2024-02-20T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('TicketsPage — loading state', () => {
  it('shows skeleton rows while tickets are loading', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TicketsPage />)
    const rows = screen.getAllByRole('row')
    // 1 header + 5 skeleton rows
    expect(rows).toHaveLength(6)
    expect(screen.queryByText('Cannot access my account')).not.toBeInTheDocument()
  })

  it('shows 0 total while loading', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TicketsPage />)
    expect(screen.getByText(/0 total tickets/i)).toBeInTheDocument()
  })
})

// ─── Loaded state ─────────────────────────────────────────────────────────────

describe('TicketsPage — loaded state', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockResponse })
  })

  it('renders ticket subjects after loading', async () => {
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByText('Cannot access my account')).toBeInTheDocument()
    expect(screen.getByText('Request a refund')).toBeInTheDocument()
  })

  it('shows the total ticket count', async () => {
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByText(/2 total tickets/i)).toBeInTheDocument()
  })

  it('renders the page heading', async () => {
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByRole('heading', { name: /tickets/i })).toBeInTheDocument()
  })

  it('uses singular "ticket" when total is 1', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ...mockResponse, total: 1 },
    })
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByText(/1 total ticket$/i)).toBeInTheDocument()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('TicketsPage — empty state', () => {
  it('shows empty message when no tickets exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: [], total: 0, page: 1, limit: 20 } })
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByText(/no tickets yet/i)).toBeInTheDocument()
  })

  it('shows 0 total tickets in the description', async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: [], total: 0, page: 1, limit: 20 } })
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByText(/0 total tickets/i)).toBeInTheDocument()
  })
})

// ─── Error state ──────────────────────────────────────────────────────────────

describe('TicketsPage — error state', () => {
  it('shows error banner when the fetch fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<TicketsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load tickets/i)
  })
})
