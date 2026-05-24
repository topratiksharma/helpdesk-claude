import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, act } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketFilters } from './TicketFilters'
import type { TicketFilterState } from './tickets.types'

// No axios or auth-client needed — TicketFilters is a pure UI component

// ─── Initial mount callback ────────────────────────────────────────────────────

describe('TicketFilters — initial mount', () => {
  it('calls onFiltersChange once on mount with default filter state', () => {
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)
    expect(onFiltersChange).toHaveBeenCalledTimes(1)
    expect(onFiltersChange).toHaveBeenCalledWith<[TicketFilterState]>({
      status: 'all',
      category: 'all',
      search: '',
    })
  })
})

// ─── Status filter buttons ─────────────────────────────────────────────────────

describe('TicketFilters — status buttons', () => {
  it('calls onFiltersChange with status "open" when Open is clicked', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'open' }),
    )
  })

  it('calls onFiltersChange with status "resolved" when Resolved is clicked', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)
    await user.click(screen.getByRole('button', { name: 'Resolved' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'resolved' }),
    )
  })

  it('calls onFiltersChange with status "closed" when Closed is clicked', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)
    await user.click(screen.getByRole('button', { name: 'Closed' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'closed' }),
    )
  })

  it('calls onFiltersChange with status "all" when All is clicked after another filter', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'all' }),
    )
  })
})

// ─── Search debounce ──────────────────────────────────────────────────────────

describe('TicketFilters — search debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call onFiltersChange with search value before 400ms debounce fires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    // Clear the initial mount call
    onFiltersChange.mockClear()

    await user.type(screen.getByPlaceholderText('Search tickets…'), 'hello')

    // Timer has not fired yet — search should still be ''
    const callsWithHello = onFiltersChange.mock.calls.filter(
      ([f]: [TicketFilterState]) => f.search === 'hello',
    )
    expect(callsWithHello).toHaveLength(0)
  })

  it('calls onFiltersChange with search value after 400ms', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    onFiltersChange.mockClear()

    await user.type(screen.getByPlaceholderText('Search tickets…'), 'hello')

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'hello' }),
    )
  })

  it('calls onFiltersChange with empty search after clearing the input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    const input = screen.getByPlaceholderText('Search tickets…')

    await user.type(input, 'hello')
    act(() => { vi.advanceTimersByTime(400) })

    onFiltersChange.mockClear()

    await user.clear(input)
    act(() => { vi.advanceTimersByTime(400) })

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: '' }),
    )
  })
})

// ─── Category select ──────────────────────────────────────────────────────────

describe('TicketFilters — category select', () => {
  it('calls onFiltersChange with the selected category', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    // Open the Select dropdown
    await user.click(screen.getByRole('combobox'))

    // Click one of the category options (General)
    await user.click(screen.getByRole('option', { name: 'General' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'general_questions' }),
    )
  })

  it('calls onFiltersChange with "technical_questions" when Technical is selected', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Technical' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'technical_questions' }),
    )
  })

  it('calls onFiltersChange with "all" when All categories is selected', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    // First select a specific category
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'General' }))

    onFiltersChange.mockClear()

    // Then go back to All
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'All categories' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'all' }),
    )
  })
})
