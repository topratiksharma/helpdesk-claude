import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, act, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// ─── Query params — defaults ───────────────────────────────────────────────────

describe('TicketsPage — default query params', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockResponse })
  })

  it('does not include "search" param in the default query call', async () => {
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')
    const callParams = mockedAxios.get.mock.calls[0][1]?.params ?? {}
    expect(callParams).not.toHaveProperty('search')
  })

  it('does not include "status" param in the default query call', async () => {
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')
    const callParams = mockedAxios.get.mock.calls[0][1]?.params ?? {}
    expect(callParams).not.toHaveProperty('status')
  })

  it('does not include "category" param in the default query call', async () => {
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')
    const callParams = mockedAxios.get.mock.calls[0][1]?.params ?? {}
    expect(callParams).not.toHaveProperty('category')
  })

  it('includes "page" param in the default query call', async () => {
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')
    const callParams = mockedAxios.get.mock.calls[0][1]?.params ?? {}
    expect(callParams).toHaveProperty('page', 1)
  })
})

// ─── Filter interaction → query params ───────────────────────────────────────

describe('TicketsPage — status filter interaction', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockResponse })
  })

  it('passes status="open" param to axios.get after clicking Open filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')

    await user.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() => {
      const calls = mockedAxios.get.mock.calls
      const lastCallParams = calls[calls.length - 1][1]?.params ?? {}
      expect(lastCallParams).toHaveProperty('status', 'open')
    })
  })

  it('resets to page 1 when a status filter is applied', async () => {
    const user = userEvent.setup()
    // Use a large total so the pagination control renders
    mockedAxios.get.mockResolvedValue({
      data: { ...mockResponse, total: 100 },
    })
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')

    // Navigate to page 2 by clicking the page 2 anchor in the nav
    // PaginationControl renders <a> elements without href, so query by text within nav
    const nav = screen.getByRole('navigation')
    const page2Anchor = within(nav).getByText('2')
    await user.click(page2Anchor)

    await waitFor(() => {
      const calls = mockedAxios.get.mock.calls
      const lastParams = calls[calls.length - 1][1]?.params ?? {}
      expect(lastParams).toHaveProperty('page', 2)
    })

    // Now click a status filter — page should reset to 1
    await user.click(screen.getByRole('button', { name: 'Resolved' }))

    await waitFor(() => {
      const calls = mockedAxios.get.mock.calls
      const lastParams = calls[calls.length - 1][1]?.params ?? {}
      expect(lastParams).toHaveProperty('page', 1)
    })
  })
})

// ─── Search filter interaction → query params ─────────────────────────────────
//
// Search has a 400ms debounce. We wait for the debounce to fire with real
// timers using a generous waitFor timeout.

describe('TicketsPage — search filter interaction', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockResponse })
  })

  it('passes search param to axios.get after debounce fires', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)
    await screen.findByText('Cannot access my account')

    // Type in the search box
    await user.type(screen.getByPlaceholderText('Search tickets…'), 'billing')

    // The 400ms debounce fires naturally; waitFor polls until axios.get is called
    // with the search param (use a 2s timeout to comfortably exceed the 400ms debounce)
    await waitFor(
      () => {
        const calls = mockedAxios.get.mock.calls
        const lastParams = calls[calls.length - 1][1]?.params ?? {}
        expect(lastParams).toHaveProperty('search', 'billing')
      },
      { timeout: 2000 },
    )
  }, 8000)
})
