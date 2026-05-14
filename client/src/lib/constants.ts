import type { TicketStatus, TicketCategory } from '@helpdesk/core'

export enum Role {
  admin = 'admin',
  agent = 'agent',
}

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  general_questions: 'General Questions',
  technical_questions: 'Technical Questions',
  refund: 'Refund',
}

export const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-muted text-muted-foreground border-border',
}
