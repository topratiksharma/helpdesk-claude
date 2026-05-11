import { useSession } from '@/lib/auth-client'

export default function HomePage() {
  const { data: session } = useSession()
  const firstName = session?.user.name.split(' ')[0] ?? 'there'

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

      {/* Placeholder stats cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {[
          { label: 'Open tickets', value: '—' },
          { label: 'Resolved today', value: '—' },
          { label: 'Avg. response time', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-md px-6 py-5"
          >
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-[0.06em]">
              {stat.label}
            </p>
            <p className="text-[28px] font-display font-medium text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
