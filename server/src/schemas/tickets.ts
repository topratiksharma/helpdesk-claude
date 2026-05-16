import { z } from "zod";
import { TicketStatusEnum, TicketCategoryEnum } from "@helpdesk/core";

const SORTABLE_FIELDS = [
  "id",
  "subject",
  "fromName",
  "status",
  "updatedAt",
] as const;

export type TicketSortField = (typeof SORTABLE_FIELDS)[number];

export const TicketsQuerySchema = z.object({
  status: TicketStatusEnum.optional(),
  category: TicketCategoryEnum.optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(SORTABLE_FIELDS).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TicketsQuery = z.infer<typeof TicketsQuerySchema>;
