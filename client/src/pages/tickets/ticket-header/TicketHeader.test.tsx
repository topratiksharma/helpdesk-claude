import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { TicketHeader } from './TicketHeader'
import { renderWithProviders } from '@/test/utils'

describe('TicketHeader', () => {
  it('renders the ticket subject', () => {
    renderWithProviders(<TicketHeader id={42} subject="Login issue" status="open" />)
    expect(screen.getByRole('heading', { name: 'Login issue' })).toBeInTheDocument()
  })

  it('renders the ticket id with a # prefix', () => {
    renderWithProviders(<TicketHeader id={42} subject="Login issue" status="open" />)
    expect(screen.getByText('#42')).toBeInTheDocument()
  })

  it('renders the status badge text', () => {
    renderWithProviders(<TicketHeader id={1} subject="Test" status="resolved" />)
    expect(screen.getByText('resolved')).toBeInTheDocument()
  })

  it.each([
    ['open' as const],
    ['resolved' as const],
    ['closed' as const],
  ])('renders "%s" status badge', (status) => {
    renderWithProviders(<TicketHeader id={1} subject="Test" status={status} />)
    expect(screen.getByText(status)).toBeInTheDocument()
  })
})
