import axios from 'axios'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type SortingState, type OnChangeFn } from '@tanstack/react-table'
import {
  type TicketsResponse,
  type TicketSortField,
  type SortOrder,
  type TicketFilterState,
} from './tickets.types'
import { TicketsTable } from './ticket-table/TicketsTable'
import { TicketFilters } from './TicketFilters'
import { PaginationControl } from '@/components/PaginationControl'
import { ErrorAlert } from '@/components/ErrorAlert'

const LIMIT = 10;

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])
  const [filters, setFilters] = useState<TicketFilterState>({
    status: 'all',
    category: 'all',
    search: '',
  })
  const [page, setPage] = useState(1)

  const handleFiltersChange = useCallback((f: TicketFilterState) => {
    setFilters(f)
    setPage(1)
  }, [])

  const handleSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    setSorting(updater)
    setPage(1)
  }, [])

  const sortBy = (sorting[0]?.id ?? 'updatedAt') as TicketSortField
  const sortOrder: SortOrder = sorting[0]?.desc === false ? 'asc' : 'desc'

  const { data, isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortOrder, filters.status, filters.category, filters.search, page],
    queryFn: () =>
      axios
        .get<TicketsResponse>('/api/tickets', {
          params: {
            sortBy,
            sortOrder,
            page,
            limit: LIMIT,
            ...(filters.status !== 'all' && { status: filters.status }),
            ...(filters.category !== 'all' && { category: filters.category }),
            ...(filters.search && { search: filters.search }),
          },
          withCredentials: true,
        })
        .then((res) => res.data),
  })

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-foreground tracking-[-0.03em] leading-[1.2] mb-1.5">
            Tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} total ticket{data?.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <TicketFilters onFiltersChange={handleFiltersChange} />
      </div>

      {isError && (
        <ErrorAlert className="mb-6" message="Could not load tickets. Please try again." />
      )}

      <TicketsTable
        tickets={data?.tickets ?? []}
        loading={isPending}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      <PaginationControl
        page={page}
        total={data?.total ?? 0}
        limit={LIMIT}
        onPageChange={setPage}
      />
    </div>
  )
}
