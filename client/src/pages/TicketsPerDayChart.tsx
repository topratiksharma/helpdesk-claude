import { Skeleton } from '@/components/ui/skeleton'
import type { DailyTicketCount } from '@helpdesk/core'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 shadow-sm text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-foreground">{payload[0].value} tickets</p>
    </div>
  )
}

interface TicketsPerDayChartProps {
  data: DailyTicketCount[]
  isLoading: boolean
}

export default function TicketsPerDayChart({ data, isLoading }: TicketsPerDayChartProps) {
  return (
    <div className="mt-4 bg-card border border-border rounded-md px-5 pt-5 pb-3 shadow-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-[0.06em] mb-4">
        Tickets created — last 30 days
      </p>
      {isLoading ? (
        <Skeleton className="h-[160px] w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
            <XAxis
              dataKey="date"
              interval={4}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
            <Bar dataKey="count" fill="#818cf8" radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
