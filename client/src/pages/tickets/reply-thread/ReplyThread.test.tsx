import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { ReplyThread } from './ReplyThread'
import { renderWithProviders } from '@/test/utils'
import type { Message } from '../tickets.types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const now = new Date().toISOString()

const agentMessage: Message = {
  id: 'm1',
  body: 'Hello, how can I help?',
  sender: 'agent',
  createdAt: now,
  author: { id: 'u1', name: 'Alice Agent', email: 'alice@test.com' },
}

const customerMessage: Message = {
  id: 'm2',
  body: 'I need help with my order.',
  sender: 'customer',
  createdAt: now,
  author: null,
}

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('ReplyThread — empty state', () => {
  it('shows "No messages yet" when messages array is empty', () => {
    renderWithProviders(<ReplyThread messages={[]} />)
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })
})

// ─── Message rendering ────────────────────────────────────────────────────────

describe('ReplyThread — message rendering', () => {
  it('renders an agent message body', () => {
    renderWithProviders(<ReplyThread messages={[agentMessage]} />)
    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument()
  })

  it('renders a customer message body', () => {
    renderWithProviders(<ReplyThread messages={[customerMessage]} />)
    expect(screen.getByText('I need help with my order.')).toBeInTheDocument()
  })

  it('shows the author name for agent messages', () => {
    renderWithProviders(<ReplyThread messages={[agentMessage]} />)
    expect(screen.getByText('Alice Agent')).toBeInTheDocument()
  })

  it('falls back to "Agent" when an agent message has no author', () => {
    renderWithProviders(<ReplyThread messages={[{ ...agentMessage, author: null }]} />)
    expect(screen.getByText('Agent')).toBeInTheDocument()
  })

  it('shows "Customer" label for customer messages', () => {
    renderWithProviders(<ReplyThread messages={[customerMessage]} />)
    expect(screen.getByText('Customer')).toBeInTheDocument()
  })

  it('renders all messages when multiple are provided', () => {
    renderWithProviders(<ReplyThread messages={[agentMessage, customerMessage]} />)
    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument()
    expect(screen.getByText('I need help with my order.')).toBeInTheDocument()
  })
})

// ─── Day separator ────────────────────────────────────────────────────────────

describe('ReplyThread — day separator', () => {
  it('renders a "Today" separator for today\'s messages', () => {
    renderWithProviders(<ReplyThread messages={[agentMessage]} />)
    expect(screen.getByText(/today/i)).toBeInTheDocument()
  })

  it('renders a single separator when all messages are from the same day', () => {
    renderWithProviders(<ReplyThread messages={[agentMessage, customerMessage]} />)
    expect(screen.getAllByText(/today/i)).toHaveLength(1)
  })

  it('renders two separators when messages span two different days', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const oldMessage: Message = { ...agentMessage, id: 'm3', createdAt: yesterday.toISOString() }
    renderWithProviders(<ReplyThread messages={[oldMessage, customerMessage]} />)
    expect(screen.getByText(/today/i)).toBeInTheDocument()
    expect(screen.getByText(/yesterday/i)).toBeInTheDocument()
  })
})

// ─── Avatar initials ──────────────────────────────────────────────────────────

describe('ReplyThread — avatar initials', () => {
  it('renders the correct initials for the agent author', () => {
    renderWithProviders(<ReplyThread messages={[agentMessage]} />)
    expect(screen.getByText('AA')).toBeInTheDocument()
  })

  it('renders "C" initial for customer messages', () => {
    renderWithProviders(<ReplyThread messages={[customerMessage]} />)
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})
