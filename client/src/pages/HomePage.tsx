import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Skeleton } from '@/components/ui/skeleton'
import { Inbox, LayoutGrid, Bot, Percent, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatsResponse } from '@helpdesk/core'
import TicketsPerDayChart from './TicketsPerDayChart'

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

      <TicketsPerDayChart data={stats?.ticketsPerDay ?? []} isLoading={isPending} />
    </div>
  )
}
