import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsResponse {
  openTickets: number
  resolvedToday: number
  totalTickets: number
}

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

  const statCards = [
    { label: 'Open tickets', value: stats?.openTickets },
    { label: 'Resolved today', value: stats?.resolvedToday },
    { label: 'Total tickets', value: stats?.totalTickets },
  ]

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
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-md px-6 py-5"
          >
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-[0.06em]">
              {stat.label}
            </p>
            {isPending ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-[28px] font-display font-medium text-foreground">
                {stat.value ?? '—'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
