import { Navigate, Outlet } from 'react-router'
import { useSession } from '@/lib/auth-client'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3.5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="animate-spin text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] text-muted-foreground">Loading…</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
