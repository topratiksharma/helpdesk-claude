import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table'
import { useNavigate } from 'react-router'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { type TicketListItem, type TicketCategory } from './tickets.types'
import type { TicketStatus } from './tickets.types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CATEGORY_LABELS, STATUS_STYLES } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/EmptyState'

interface TicketsTableProps {
  tickets: TicketListItem[]
  loading: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp size={13} strokeWidth={2} />
  if (sorted === 'desc') return <ChevronDown size={13} strokeWidth={2} />
  return <ChevronsUpDown size={13} strokeWidth={1.5} className="text-muted-foreground/50" />
}

const columns: ColumnDef<TicketListItem>[] = [
  {
    accessorKey: 'id',
    header: '#',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-muted-foreground/60 tracking-wide">
        {getValue<number>()}
      </span>
    ),
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="font-medium text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'fromName',
    header: 'From',
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0 select-none">
          {getInitials(row.original.fromName)}
        </div>
        <div className="min-w-0">
          <div className="text-sm leading-tight">{row.original.fromName}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
            {row.original.fromEmail}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    cell: ({ getValue }) => {
      const status = getValue<TicketStatus>()
      return (
        <Badge variant="outline" className={STATUS_STYLES[status]}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    enableSorting: false,
    cell: ({ getValue }) => {
      const cat = getValue<TicketCategory | null>()
      return (
        <span className="text-sm text-muted-foreground">
          {cat ? CATEGORY_LABELS[cat] : '—'}
        </span>
      )
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{formatDate(getValue<string>())}</span>
    ),
  },
]

const SKELETON_ROWS = 5

export function TicketsTable({ tickets, loading, sorting, onSortingChange }: TicketsTableProps) {
  const navigate = useNavigate()
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  })

  const headerRow = (
    <TableRow>
      {table.getFlatHeaders().map((header) => {
        const canSort = header.column.getCanSort()
        const sorted = header.column.getIsSorted()
        return (
          <TableHead
            key={header.id}
            className={cn(
              'text-xs text-muted-foreground uppercase tracking-[0.06em]',
              canSort && 'cursor-pointer select-none hover:text-foreground',
            )}
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
          >
            <div className="flex items-center gap-1">
              {flexRender(header.column.columnDef.header, header.getContext())}
              {canSort && <SortIcon sorted={sorted} />}
            </div>
          </TableHead>
        )
      })}
    </TableRow>
  )

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>{headerRow}</TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-3.5 w-6" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <EmptyState message="No tickets yet." className="text-center py-16" />
    )
  }

  return (
    <div className="bg-card border border-border rounded-md overflow-hidden">
      <Table>
        <TableHeader>{headerRow}</TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                'cursor-pointer hover:bg-muted/50 transition-colors',
                row.original.status === 'open' && 'border-l-2 border-l-amber-400',
              )}
              onClick={() => navigate(`/tickets/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
