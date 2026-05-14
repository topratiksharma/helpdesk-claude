import { type TicketListItem } from './tickets.types'
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

interface TicketsTableProps {
  tickets: TicketListItem[]
  loading: boolean
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

const columns = (
  <TableRow>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em] w-12">#</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Subject</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">From</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Status</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Category</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em] text-right">Messages</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Updated</TableHead>
  </TableRow>
)

export function TicketsTable({ tickets, loading }: TicketsTableProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>{columns}</TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
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
        <TableHeader>{columns}</TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="text-xs text-muted-foreground">{ticket.id}</TableCell>
              <TableCell className="font-medium text-sm">{ticket.subject}</TableCell>
              <TableCell>
                <div className="text-sm">{ticket.fromName}</div>
                <div className="text-xs text-muted-foreground">{ticket.fromEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={STATUS_STYLES[ticket.status]}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {ticket.category ? CATEGORY_LABELS[ticket.category] ?? ticket.category : '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground text-right">
                {ticket._count.messages}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
