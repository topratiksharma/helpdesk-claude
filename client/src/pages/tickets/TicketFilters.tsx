import { useState, useEffect } from 'react'
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
import type { StatusFilter, CategoryFilter, TicketFilterState } from './tickets.types'

interface TicketFiltersProps {
  onFiltersChange: (filters: TicketFilterState) => void
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function TicketFilters({ onFiltersChange }: TicketFiltersProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    onFiltersChange({ status: statusFilter, category: categoryFilter, search })
  }, [statusFilter, categoryFilter, search])

  return (
    <div className="flex items-center gap-3 flex-wrap">
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
  )
}
