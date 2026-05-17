import { z } from "zod";

export const MessageSenderEnum = z.enum(["agent", "customer"]);
export type MessageSender = z.infer<typeof MessageSenderEnum>;

export const createMessageSchema = z.object({
  body: z.string().trim().max(2000).min(1, "Reply cannot be empty").max(10000),
  bodyHtml: z.string().min(1).max(2000).optional(),
  sender: MessageSenderEnum,
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
