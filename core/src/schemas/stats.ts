export interface StatsResponse {
  totalTickets: number
  openTickets: number
  aiResolvedTickets: number
  aiResolutionPercentage: number
  avgResolutionTimeHours: number | null
}
