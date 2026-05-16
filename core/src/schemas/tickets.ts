import { z } from 'zod'

export const TicketStatusEnum = z.enum(['open', 'resolved', 'closed'])
export type TicketStatus = z.infer<typeof TicketStatusEnum>

export const TicketCategoryEnum = z.enum(['general_questions', 'technical_questions', 'refund'])
export type TicketCategory = z.infer<typeof TicketCategoryEnum>

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(255),
  body: z.string().trim().min(1, 'Body is required'),
  fromEmail: z.email('Please enter a valid email address'),
  fromName: z.string().trim().min(1, 'From name is required').max(100),
  category: TicketCategoryEnum.optional(),
  assignedToId: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

export const updateTicketSchema = z
  .object({
    status: TicketStatusEnum.optional(),
    category: TicketCategoryEnum.nullable().optional(),
    assignedToId: z.string().min(1).nullable().optional(),
    subject: z.string().trim().min(1).max(255).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.status && !data.category && data.assignedToId === undefined && !data.subject) {
      ctx.addIssue({ code: 'custom', message: 'At least one field must be provided.' })
    }
  })

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>

export interface Ticket {
  id: number
  subject: string
  fromEmail: string
  fromName: string
  status: TicketStatus
  category: TicketCategory | null
  assignedToId: string | null
  createdAt: string
  updatedAt: string
}

const SORTABLE_FIELDS = ['id', 'subject', 'fromName', 'status', 'updatedAt'] as const

export type TicketSortField = (typeof SORTABLE_FIELDS)[number]

export const ticketsListQuerySchema = z.object({
  status: TicketStatusEnum.optional(),
  category: TicketCategoryEnum.optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(SORTABLE_FIELDS).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type TicketsQuery = z.infer<typeof ticketsListQuerySchema>
