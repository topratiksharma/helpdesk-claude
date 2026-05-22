import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Skeleton } from '@/components/ui/skeleton'
import { Inbox, LayoutGrid, Bot, Percent, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatsResponse } from '@helpdesk/core'
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

function formatResolutionTime(hours: number | null): string {
  if (hours === null) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const statCards: {
  label: string
  icon: React.ElementType
  iconClass: string
  accentClass: string
  getValue: (s: StatsResponse) => string
}[] = [
  {
    label: 'Total tickets',
    icon: LayoutGrid,
    iconClass: 'text-primary',
    accentClass: 'border-l-[3px] border-l-primary/40',
    getValue: (s) => String(s.totalTickets),
  },
  {
    label: 'Open tickets',
    icon: Inbox,
    iconClass: 'text-amber-500',
    accentClass: 'border-l-[3px] border-l-amber-400',
    getValue: (s) => String(s.openTickets),
  },
  {
    label: 'Resolved by AI',
    icon: Bot,
    iconClass: 'text-violet-500',
    accentClass: 'border-l-[3px] border-l-violet-400',
    getValue: (s) => String(s.aiResolvedTickets),
  },
  {
    label: 'AI resolution %',
    icon: Percent,
    iconClass: 'text-sky-500',
    accentClass: 'border-l-[3px] border-l-sky-400',
    getValue: (s) => `${s.aiResolutionPercentage}%`,
  },
  {
    label: 'Avg resolution time',
    icon: Clock,
    iconClass: 'text-emerald-500',
    accentClass: 'border-l-[3px] border-l-emerald-400',
    getValue: (s) => formatResolutionTime(s.avgResolutionTimeHours),
  },
]

export default function HomePage() {
  const { data: session } = useSession()
  const firstName = session?.user.name.split(' ')[0] ?? 'there'

  const { data: stats, isPending } = useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      axios
        .get<StatsResponse>('/api/stats', { withCredentials: true })
        .then((res) => res.data),
  })

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-[32px] font-medium text-foreground tracking-[-0.02em] leading-[1.2] mb-1.5">
          Good to see you, {firstName}.
        </h1>
        <p className="text-sm text-muted-foreground">
          Your support workspace is ready.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                'bg-card border border-border rounded-md px-5 py-5 shadow-sm',
                stat.accentClass,
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.06em]">
                  {stat.label}
                </p>
                <Icon size={15} strokeWidth={1.8} className={stat.iconClass} />
              </div>
              {isPending ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-[30px] font-display font-medium text-foreground leading-none">
                  {stats ? stat.getValue(stats) : '—'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 bg-card border border-border rounded-md px-5 pt-5 pb-3 shadow-sm">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.06em] mb-4">
          Tickets created — last 30 days
        </p>
        {isPending ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats?.ticketsPerDay ?? []} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
    </div>
  )
}
