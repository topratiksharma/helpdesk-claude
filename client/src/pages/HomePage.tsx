import { useSession } from '@/lib/auth-client'

export default function HomePage() {
  const { data: session } = useSession()
  const firstName = session?.user.name.split(' ')[0] ?? 'there'

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 500,
            color: 'var(--color-ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: '6px',
          }}
        >
          Good to see you, {firstName}.
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)' }}>
          Your support workspace is ready.
        </p>
      </div>

      {/* Placeholder stats cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {[
          { label: 'Open tickets', value: '—' },
          { label: 'Resolved today', value: '—' },
          { label: 'Avg. response time', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--color-ink-faint)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-ink)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
