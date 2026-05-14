import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table'
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
import { cn } from '@/lib/utils'

interface TicketsTableProps {
  tickets: TicketListItem[]
  loading: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
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
      <span className="text-xs text-muted-foreground">{getValue<number>()}</span>
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
      <div>
        <div className="text-sm">{row.original.fromName}</div>
        <div className="text-xs text-muted-foreground">{row.original.fromEmail}</div>
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
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
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
      <div className="text-center py-16 text-sm text-muted-foreground">
        No tickets yet.
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-md overflow-hidden">
      <Table>
        <TableHeader>{headerRow}</TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
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
