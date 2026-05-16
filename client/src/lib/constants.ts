import type { TicketStatus, TicketCategory } from "@helpdesk/core";

export enum Role {
  admin = "admin",
  agent = "agent",
}

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  general_questions: "General",
  technical_questions: "Technical",
  refund: "Refund",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-300 font-medium",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-300 font-medium",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};
