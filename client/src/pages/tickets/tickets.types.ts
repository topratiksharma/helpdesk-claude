export type { Ticket, TicketStatus, TicketCategory, CreateTicketInput } from '@helpdesk/core'
export { TicketStatusEnum, TicketCategoryEnum } from '@helpdesk/core'

import type { Ticket } from '@helpdesk/core'

export interface TicketListItem extends Ticket {
  assignedTo: { id: string; name: string; email: string } | null
  _count: { messages: number }
}

export interface TicketsResponse {
  tickets: TicketListItem[]
  total: number
  page: number
  limit: number
}
