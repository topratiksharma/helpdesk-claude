import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, act, fireEvent } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketFilters } from './TicketFilters'
import type { TicketFilterState } from './tickets.types'

// No axios or auth-client needed — TicketFilters is a pure UI component.
//
// Radix UI Select does not work in jsdom due to missing pointer APIs. We
// replace @/components/ui/select with a native <select> so tests can interact
// with it via userEvent.selectOptions.

vi.mock('@/components/ui/select', async () => {
  const { createContext, useContext, createElement } = await import('react')

  type SelectCtx = {
    value: string
    onValueChange: (v: string) => void
    disabled?: boolean
  }

  const Ctx = createContext<SelectCtx | null>(null)

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
    return createElement(Ctx.Provider, { value: { value, onValueChange, disabled } }, children)
  }

  function SelectTrigger({ children }: { children?: React.ReactNode }) {
    return createElement(React.Fragment, null, children)
  }

  function SelectValue() {
    return null
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    const ctx = useContext(Ctx)!
    return createElement(
      'select',
      {
        'data-testid': 'category-select',
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
//
// Use vi.useFakeTimers() + fireEvent.change for typing. userEvent.type() uses
// its own timer queue internally, which can deadlock with fake timers.

describe('TicketFilters — search debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call onFiltersChange with search value before 400ms debounce fires', () => {
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    // Clear the initial mount call
    onFiltersChange.mockClear()

    const input = screen.getByPlaceholderText('Search tickets…')
    fireEvent.change(input, { target: { value: 'hello' } })

    // Debounce timer has not fired yet
    const callsWithHello = onFiltersChange.mock.calls.filter(
      ([f]) => (f as TicketFilterState).search === 'hello',
    )
    expect(callsWithHello).toHaveLength(0)
  })

  it('calls onFiltersChange with search value after 400ms', () => {
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)
    onFiltersChange.mockClear()

    const input = screen.getByPlaceholderText('Search tickets…')
    fireEvent.change(input, { target: { value: 'hello' } })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'hello' }),
    )
  })

  it('calls onFiltersChange with empty search after clearing the input', () => {
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    const input = screen.getByPlaceholderText('Search tickets…')

    // Type something, wait for debounce
    fireEvent.change(input, { target: { value: 'hello' } })
    act(() => { vi.advanceTimersByTime(400) })

    onFiltersChange.mockClear()

    // Clear the input, wait for debounce
    fireEvent.change(input, { target: { value: '' } })
    act(() => { vi.advanceTimersByTime(400) })

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: '' }),
    )
  })
})

// ─── Category select ──────────────────────────────────────────────────────────
//
// The Select mock renders a native <select data-testid="category-select">.
// We use userEvent.selectOptions to pick a value.

describe('TicketFilters — category select', () => {
  it('calls onFiltersChange with "general_questions" when General is selected', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    await user.selectOptions(screen.getByTestId('category-select'), 'general_questions')

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'general_questions' }),
    )
  })

  it('calls onFiltersChange with "technical_questions" when Technical is selected', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    await user.selectOptions(screen.getByTestId('category-select'), 'technical_questions')

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'technical_questions' }),
    )
  })

  it('calls onFiltersChange with category "all" when All categories is selected', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<TicketFilters onFiltersChange={onFiltersChange} />)

    // First pick a specific category, then go back to all
    await user.selectOptions(screen.getByTestId('category-select'), 'general_questions')
    onFiltersChange.mockClear()

    await user.selectOptions(screen.getByTestId('category-select'), 'all')

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'all' }),
    )
  })
})
