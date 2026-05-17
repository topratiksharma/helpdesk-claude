import { z } from 'zod'

export const MessageSenderEnum = z.enum(['agent', 'customer'])
export type MessageSender = z.infer<typeof MessageSenderEnum>

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, 'Reply cannot be empty').max(10000),
  sender: MessageSenderEnum,
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>
