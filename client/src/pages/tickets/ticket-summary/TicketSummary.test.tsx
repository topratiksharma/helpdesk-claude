import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { renderWithProviders } from '@/test/utils'
import { TicketSummary } from './TicketSummary'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

const mockedAxios = vi.mocked(axios)

// ─── Initial render ────────────────────────────────────────────────────────────

describe('TicketSummary — initial render', () => {
  beforeEach(() => {
    mockedAxios.isAxiosError.mockReturnValue(false)
  })

  it('renders the "Summarize" button initially', () => {
    renderWithProviders(<TicketSummary ticketId={42} />)
    expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument()
  })

  it('the "Summarize" button is not disabled initially', () => {
    renderWithProviders(<TicketSummary ticketId={42} />)
    expect(screen.getByRole('button', { name: /summarize/i })).not.toBeDisabled()
  })

  it('shows no skeleton lines initially', () => {
    renderWithProviders(<TicketSummary ticketId={42} />)
    const animatedEls = document.querySelectorAll('.animate-pulse')
    expect(animatedEls).toHaveLength(0)
  })

  it('shows no summary text initially', () => {
    renderWithProviders(<TicketSummary ticketId={42} />)
    expect(screen.queryByText('This ticket is about billing.')).not.toBeInTheDocument()
  })
})

// ─── Loading (pending) state ───────────────────────────────────────────────────

describe('TicketSummary — loading state', () => {
  it('shows "Summarizing…" on the button while request is in flight', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))
    expect(await screen.findByRole('button', { name: /summarizing…/i })).toBeInTheDocument()
  })

  it('disables the button while request is in flight', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))
    expect(await screen.findByRole('button', { name: /summarizing…/i })).toBeDisabled()
  })

  it('shows 3 skeleton lines while request is in flight', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))
    await screen.findByRole('button', { name: /summarizing…/i })
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(3)
  })
})

// ─── Success state ────────────────────────────────────────────────────────────

describe('TicketSummary — success', () => {
  beforeEach(() => {
    mockedAxios.isAxiosError.mockReturnValue(false)
  })

  it('shows the summary text after a successful POST', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValue({ data: { summary: 'This ticket is about billing.' } })
    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))
    expect(await screen.findByText('This ticket is about billing.')).toBeInTheDocument()
  })

  it('changes button label to "Regenerate" after successful summarization', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValue({ data: { summary: 'This ticket is about billing.' } })
    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))
    expect(await screen.findByRole('button', { name: /regenerate/i })).toBeInTheDocument()
  })

  it('fires another POST to the correct URL when "Regenerate" is clicked', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValue({ data: { summary: 'First summary.' } })
    renderWithProviders(<TicketSummary ticketId={42} />)

    await user.click(screen.getByRole('button', { name: /summarize/i }))
    await screen.findByRole('button', { name: /regenerate/i })

    mockedAxios.post.mockResolvedValue({ data: { summary: 'Second summary.' } })
    await user.click(screen.getByRole('button', { name: /regenerate/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
    })
  })

  it('calls axios.post with the correct URL including ticketId', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValue({ data: { summary: 'A summary.' } })
    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))
    await screen.findByText('A summary.')
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/tickets/42/summarize',
      expect.anything(),
      expect.anything(),
    )
  })
})

// ─── Error state ──────────────────────────────────────────────────────────────

describe('TicketSummary — error handling', () => {
  it('shows the server error message when axios error has response.data.error', async () => {
    const user = userEvent.setup()
    const axiosError = {
      response: { data: { error: 'AI unavailable' } },
    }
    mockedAxios.post.mockRejectedValue(axiosError)
    mockedAxios.isAxiosError.mockReturnValue(true)

    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))

    expect(await screen.findByText('AI unavailable')).toBeInTheDocument()
  })

  it('shows a generic error message when error is not an axios error', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockRejectedValue(new Error('Something went wrong'))
    mockedAxios.isAxiosError.mockReturnValue(false)

    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))

    expect(await screen.findByText('Failed to summarize ticket.')).toBeInTheDocument()
  })

  it('renders the error inside an alert element', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockRejectedValue(new Error('fail'))
    mockedAxios.isAxiosError.mockReturnValue(false)

    renderWithProviders(<TicketSummary ticketId={42} />)
    await user.click(screen.getByRole('button', { name: /summarize/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Failed to summarize ticket.')
  })
})
