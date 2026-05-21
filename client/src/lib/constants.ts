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
  open: "bg-amber-50 text-amber-700 border-amber-300 font-medium dark:bg-amber-950/40 dark:text-amber-500/70 dark:border-amber-900/60",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-300 font-medium dark:bg-emerald-950/40 dark:text-emerald-500/70 dark:border-emerald-900/60",
  closed: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/30 dark:text-slate-500/60 dark:border-slate-700/40",
};
