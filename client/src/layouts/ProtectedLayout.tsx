import { Navigate, Outlet } from 'react-router'
import { useSession } from '@/lib/auth-client'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-ink-faint)' }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '13px', color: 'var(--color-ink-faint)' }}>Loading…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-background)' }}>
      <Navbar user={session.user} />
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}
