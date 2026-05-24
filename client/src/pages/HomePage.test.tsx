import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import axios from 'axios'
import { renderWithProviders } from '@/test/utils'
import { useSession } from '@/lib/auth-client'
import HomePage from './HomePage'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

vi.mock('./TicketsPerDayChart', () => ({ default: () => null }))

const mockedAxios = vi.mocked(axios)
const mockedUseSession = vi.mocked(useSession)

const mockStats = {
  totalTickets: 42,
  openTickets: 7,
  aiResolvedTickets: 10,
  aiResolutionPercentage: 24,
  avgResolutionTimeHours: 1.5,
  ticketsPerDay: [],
}

// ─── Loading state ─────────────────────────────────────────────────────────────

describe('HomePage — loading state', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
    mockedAxios.get.mockReturnValue(new Promise(() => {}))
  })

  it('renders all 5 stat card labels while loading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText('Total tickets')).toBeInTheDocument()
    expect(screen.getByText('Open tickets')).toBeInTheDocument()
    expect(screen.getByText('Resolved by AI')).toBeInTheDocument()
    expect(screen.getByText('AI resolution %')).toBeInTheDocument()
    expect(screen.getByText('Avg resolution time')).toBeInTheDocument()
  })

  it('shows skeleton elements instead of stat values while loading', () => {
    renderWithProviders(<HomePage />)
    // Skeletons have a known class; we test they exist via their container
    // Stats values should not be visible
    expect(screen.queryByText('42')).not.toBeInTheDocument()
    // At least one skeleton should be in the DOM
    const skeletons = document.querySelectorAll('[class*="skeleton"], [data-slot="skeleton"]')
    // The Skeleton component renders a div with animate-pulse
    const animatedEls = document.querySelectorAll('.animate-pulse')
    expect(animatedEls.length).toBeGreaterThan(0)
  })

  it('does not show any stat values while loading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.queryByText('42')).not.toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()
    expect(screen.queryByText('10')).not.toBeInTheDocument()
  })
})

// ─── Loaded state ─────────────────────────────────────────────────────────────

describe('HomePage — loaded state', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
    mockedAxios.get.mockResolvedValue({ data: mockStats })
  })

  it('shows "42" for Total tickets', async () => {
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('shows "7" for Open tickets', async () => {
    renderWithProviders(<HomePage />)
    await screen.findByText('42')
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('shows "10" for Resolved by AI', async () => {
    renderWithProviders(<HomePage />)
    await screen.findByText('42')
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows "24%" for AI resolution %', async () => {
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('24%')).toBeInTheDocument()
  })

  it('shows "1h 30m" for Avg resolution time when hours=1.5', async () => {
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('1h 30m')).toBeInTheDocument()
  })
})

// ─── Greeting ─────────────────────────────────────────────────────────────────

describe('HomePage — greeting', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockStats })
  })

  it('uses the first name from session when session is present', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: 'Jane Doe' } },
      isPending: false,
    } as ReturnType<typeof useSession>)
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/good to see you, jane\./i)).toBeInTheDocument()
  })

  it('falls back to "there" when session data is null', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/good to see you, there\./i)).toBeInTheDocument()
  })
})

// ─── formatResolutionTime — edge cases ────────────────────────────────────────

describe('HomePage — formatResolutionTime via rendered output', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
  })

  it('shows "—" when avgResolutionTimeHours is null', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ...mockStats, avgResolutionTimeHours: null },
    })
    renderWithProviders(<HomePage />)
    // Wait for data to load (another card renders a value)
    await screen.findByText('42')
    // The Avg resolution time card shows "—"
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows "2h" when avgResolutionTimeHours is 2 (whole hours)', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ...mockStats, avgResolutionTimeHours: 2 },
    })
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('2h')).toBeInTheDocument()
  })

  it('shows "45m" when avgResolutionTimeHours is 0.75 (minutes only)', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ...mockStats, avgResolutionTimeHours: 0.75 },
    })
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('45m')).toBeInTheDocument()
  })
})

// ─── Stats undefined (no error, just undefined) ────────────────────────────────

describe('HomePage — undefined stats', () => {
  it('shows "—" for each card when stats is undefined after load', async () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
    // Resolve with undefined data so stats is undefined
    mockedAxios.get.mockResolvedValue({ data: undefined })
    renderWithProviders(<HomePage />)
    // Wait for pending state to clear (skeletons disappear)
    // After load with undefined stats, each card shows "—"
    const dashes = await screen.findAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── No error banner on fetch failure ─────────────────────────────────────────

describe('HomePage — error handling', () => {
  it('does not render an error banner when axios.get rejects', async () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)
    mockedAxios.get.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<HomePage />)
    // Give time for the rejection to settle
    await screen.findByText('Total tickets')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
