import { z } from "zod";

export const inboundEmailSchema = z.object({
  from: z.email(),
  fromName: z.string().min(1),
  subject: z.string().min(1),
  text: z.string().optional().default(""),
  html: z.string().optional().default(""),
  messageId: z.string().min(1),
  inReplyTo: z.string().optional(),
});

export type InboundEmail = z.infer<typeof inboundEmailSchema>;
