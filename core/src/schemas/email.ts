import { z } from "zod";

export const inboundEmailSchema = z.object({
  from: z.email().max(255),
  fromName: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  text: z.string().max(1000).optional().default(""),
  html: z.string().max(2000).optional().default(""),
  messageId: z.string().min(1).max(255),
  inReplyTo: z.string().max(255).optional(),
});

export type InboundEmail = z.infer<typeof inboundEmailSchema>;
