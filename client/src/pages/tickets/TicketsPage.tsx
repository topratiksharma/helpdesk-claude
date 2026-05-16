import axios from 'axios'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import {
  type TicketsResponse,
  type TicketSortField,
  type SortOrder,
  type TicketStatus,
  type TicketCategory,
} from './tickets.types'
import { TicketsTable } from './TicketsTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CATEGORY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

type StatusFilter = TicketStatus | 'all'
type CategoryFilter = TicketCategory | 'all'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const sortBy = (sorting[0]?.id ?? 'updatedAt') as TicketSortField
  const sortOrder: SortOrder = sorting[0]?.desc === false ? 'asc' : 'desc'

  const { data, isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortOrder, statusFilter, categoryFilter, search],
    queryFn: () =>
      axios
        .get<TicketsResponse>('/api/tickets', {
          params: {
            sortBy,
            sortOrder,
            ...(statusFilter !== 'all' && { status: statusFilter }),
            ...(categoryFilter !== 'all' && { category: categoryFilter }),
            ...(search && { search }),
          },
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

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            strokeWidth={1.8}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            placeholder="Search tickets…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-[34px] w-[220px] pl-8 text-sm"
          />
        </div>

        {/* Segmented status control */}
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                'px-3 py-1 rounded text-sm transition-all',
                statusFilter === value
                  ? 'bg-card shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category dropdown */}
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
        >
          <SelectTrigger className="h-[34px] w-[180px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
