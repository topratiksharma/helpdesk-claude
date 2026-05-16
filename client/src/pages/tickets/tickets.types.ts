export type { Ticket, TicketStatus, TicketCategory, CreateTicketInput, AgentListItem, AgentsResponse } from '@helpdesk/core'
export { TicketStatusEnum, TicketCategoryEnum } from '@helpdesk/core'

import type { Ticket, TicketStatus, TicketCategory } from '@helpdesk/core'

export interface TicketListItem extends Ticket {
  assignedTo: { id: string; name: string; email: string } | null
  _count: { messages: number }
}

export interface Message {
  id: string
  body: string
  htmlBody?: string
  sender: 'agent' | 'customer'
  createdAt: string
  author: { id: string; name: string; email: string } | null
}

export interface TicketDetail extends Ticket {
  assignedTo: { id: string; name: string; email: string } | null
  messages: Message[]
}

export interface TicketDetailResponse {
  ticket: TicketDetail
}

export interface TicketsResponse {
  tickets: TicketListItem[]
  total: number
  page: number
  limit: number
}

export type TicketSortField = 'id' | 'subject' | 'fromName' | 'status' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

export interface TicketSortState {
  field: TicketSortField
  order: SortOrder
}

export type StatusFilter = TicketStatus | 'all'
export type CategoryFilter = TicketCategory | 'all'

export interface TicketFilterState {
  status: StatusFilter
  category: CategoryFilter
  search: string
}
