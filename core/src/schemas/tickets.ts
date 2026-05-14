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
    category: TicketCategoryEnum.optional(),
    assignedToId: z.string().nullable().optional(),
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
