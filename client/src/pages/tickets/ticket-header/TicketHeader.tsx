import { Badge } from '@/components/ui/badge'
import { STATUS_STYLES } from '@/lib/constants'
import type { TicketStatus } from '../tickets.types'

interface TicketHeaderProps {
  id: number
  subject: string
  status: TicketStatus
}

export function TicketHeader({ id, subject, status }: TicketHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-muted-foreground/60 tracking-wide">
          #{id}
        </span>
        <Badge variant="outline" className={STATUS_STYLES[status]}>
          {status}
        </Badge>
      </div>
      <h1 className="font-display text-[28px] font-medium text-foreground tracking-[-0.02em] leading-[1.2]">
        {subject}
      </h1>
    </div>
  )
}
