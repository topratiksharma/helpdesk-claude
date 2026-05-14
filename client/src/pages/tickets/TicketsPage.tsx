import axios from 'axios'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { type TicketsResponse, type TicketSortField, type SortOrder } from './tickets.types'
import { TicketsTable } from './TicketsTable'

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])

  const sortBy = (sorting[0]?.id ?? 'updatedAt') as TicketSortField
  const sortOrder: SortOrder = sorting[0]?.desc === false ? 'asc' : 'desc'

  const { data, isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortOrder],
    queryFn: () =>
      axios
        .get<TicketsResponse>('/api/tickets', {
          params: { sortBy, sortOrder },
          withCredentials: true,
        })
        .then((res) => res.data),
  })

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-[32px] font-medium text-foreground tracking-[-0.02em] leading-[1.2] mb-1.5">
            Tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} total ticket{data?.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-6 bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
        >
          Could not load tickets. Please try again.
        </div>
      )}

      <TicketsTable
        tickets={data?.tickets ?? []}
        loading={isPending}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  )
}
