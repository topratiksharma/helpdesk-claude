import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginationControl } from './PaginationControl'

// Pure presentational component — no providers, no mocks needed.
//
// Note: shadcn/ui PaginationLink renders <a> elements without `href`, so they
// are not accessible as role="link" per ARIA spec. We query them by their text
// content via getByText / queryByText, and query Previous/Next by aria-label.

function renderPagination(props: {
  page: number
  total: number
  limit: number
  onPageChange?: (page: number) => void
}) {
  const onPageChange = props.onPageChange ?? vi.fn()
  const { container } = render(<PaginationControl {...props} onPageChange={onPageChange} />)
  return { container, onPageChange }
}

/** Get the <a> element for a page number by its visible text. */
function getPageAnchor(pageNum: number) {
  // Page number anchors contain only the number as text.
  // We restrict to the nav element to avoid matching the "Showing X–Y of Z" text.
  const nav = screen.getByRole('navigation')
  return within(nav).getByText(String(pageNum))
}

function queryPageAnchor(pageNum: number) {
  try {
    return getPageAnchor(pageNum)
  } catch {
    return null
  }
}

// ─── Hidden when 1 or fewer pages ─────────────────────────────────────────────

describe('PaginationControl — hidden states', () => {
  it('renders nothing when total is less than the limit (1 page)', () => {
    const { container } = renderPagination({ page: 1, total: 5, limit: 10 })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when total equals the limit (exactly 1 page)', () => {
    const { container } = renderPagination({ page: 1, total: 10, limit: 10 })
    expect(container).toBeEmptyDOMElement()
  })
})

// ─── Visible when 2+ pages ────────────────────────────────────────────────────

describe('PaginationControl — visible states', () => {
  it('renders when total exceeds limit (2+ pages)', () => {
    const { container } = renderPagination({ page: 1, total: 25, limit: 10 })
    expect(container).not.toBeEmptyDOMElement()
  })
})

// ─── Showing text ─────────────────────────────────────────────────────────────

describe('PaginationControl — showing text', () => {
  it('shows "Showing 1–10 of 25" on page 1', () => {
    renderPagination({ page: 1, total: 25, limit: 10 })
    expect(screen.getByText('Showing 1–10 of 25')).toBeInTheDocument()
  })

  it('shows "Showing 11–20 of 25" on page 2', () => {
    renderPagination({ page: 2, total: 25, limit: 10 })
    expect(screen.getByText('Showing 11–20 of 25')).toBeInTheDocument()
  })

  it('shows "Showing 21–25 of 25" on last page with remainder', () => {
    renderPagination({ page: 3, total: 25, limit: 10 })
    expect(screen.getByText('Showing 21–25 of 25')).toBeInTheDocument()
  })
})

// ─── Page range algorithm ─────────────────────────────────────────────────────

describe('PaginationControl — page range algorithm', () => {
  it('shows all pages when totalPages <= 7', () => {
    renderPagination({ page: 1, total: 70, limit: 10 })
    for (let i = 1; i <= 7; i++) {
      expect(getPageAnchor(i)).toBeInTheDocument()
    }
    expect(queryPageAnchor(8)).not.toBeInTheDocument()
  })

  it('shows [1,2,3,4,5,ellipsis,20] when page=2 and totalPages=20', () => {
    renderPagination({ page: 2, total: 200, limit: 10 })
    expect(getPageAnchor(1)).toBeInTheDocument()
    expect(getPageAnchor(2)).toBeInTheDocument()
    expect(getPageAnchor(3)).toBeInTheDocument()
    expect(getPageAnchor(4)).toBeInTheDocument()
    expect(getPageAnchor(5)).toBeInTheDocument()
    expect(getPageAnchor(20)).toBeInTheDocument()
    // Pages in the middle shouldn't show
    expect(queryPageAnchor(10)).not.toBeInTheDocument()
    // Ellipsis should appear (rendered as a <span aria-hidden>)
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByText('More pages', { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('shows [1,ellipsis,16,17,18,19,20] when page=18 and totalPages=20', () => {
    renderPagination({ page: 18, total: 200, limit: 10 })
    expect(getPageAnchor(1)).toBeInTheDocument()
    expect(getPageAnchor(16)).toBeInTheDocument()
    expect(getPageAnchor(17)).toBeInTheDocument()
    expect(getPageAnchor(18)).toBeInTheDocument()
    expect(getPageAnchor(19)).toBeInTheDocument()
    expect(getPageAnchor(20)).toBeInTheDocument()
    // Pages in the middle shouldn't show
    expect(queryPageAnchor(10)).not.toBeInTheDocument()
  })

  it('shows [1,ellipsis,9,10,11,ellipsis,20] when page=10 and totalPages=20', () => {
    renderPagination({ page: 10, total: 200, limit: 10 })
    expect(getPageAnchor(1)).toBeInTheDocument()
    expect(getPageAnchor(9)).toBeInTheDocument()
    expect(getPageAnchor(10)).toBeInTheDocument()
    expect(getPageAnchor(11)).toBeInTheDocument()
    expect(getPageAnchor(20)).toBeInTheDocument()
    // Should not include pages far away
    expect(queryPageAnchor(5)).not.toBeInTheDocument()
    expect(queryPageAnchor(15)).not.toBeInTheDocument()
  })
})

// ─── Previous / Next disabled states ──────────────────────────────────────────

describe('PaginationControl — Previous / Next disabled', () => {
  it('sets aria-disabled="true" on the Previous anchor when on page 1', () => {
    renderPagination({ page: 1, total: 30, limit: 10 })
    const prev = screen.getByLabelText('Go to previous page')
    expect(prev).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not set aria-disabled on the Previous anchor when not on page 1', () => {
    renderPagination({ page: 2, total: 30, limit: 10 })
    const prev = screen.getByLabelText('Go to previous page')
    expect(prev).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('sets aria-disabled="true" on the Next anchor when on the last page', () => {
    renderPagination({ page: 3, total: 30, limit: 10 })
    const next = screen.getByLabelText('Go to next page')
    expect(next).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not set aria-disabled on the Next anchor when not on the last page', () => {
    renderPagination({ page: 1, total: 30, limit: 10 })
    const next = screen.getByLabelText('Go to next page')
    expect(next).not.toHaveAttribute('aria-disabled', 'true')
  })
})

// ─── onPageChange callbacks ───────────────────────────────────────────────────

describe('PaginationControl — onPageChange callbacks', () => {
  it('calls onPageChange with page 2 when page 2 is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationControl page={1} total={30} limit={10} onPageChange={onPageChange} />)
    await user.click(getPageAnchor(2))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page+1 when Next is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationControl page={1} total={30} limit={10} onPageChange={onPageChange} />)
    await user.click(screen.getByLabelText('Go to next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page-1 when Previous is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationControl page={2} total={30} limit={10} onPageChange={onPageChange} />)
    await user.click(screen.getByLabelText('Go to previous page'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})

// ─── Active page ──────────────────────────────────────────────────────────────

describe('PaginationControl — active page', () => {
  it('marks the current page anchor with aria-current="page"', () => {
    renderPagination({ page: 2, total: 30, limit: 10 })
    const page2Anchor = getPageAnchor(2)
    expect(page2Anchor).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark other page anchors with aria-current="page"', () => {
    renderPagination({ page: 2, total: 30, limit: 10 })
    const page1Anchor = getPageAnchor(1)
    expect(page1Anchor).not.toHaveAttribute('aria-current', 'page')
  })
})
