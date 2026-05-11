import { Navigate, Outlet } from 'react-router'
import { useSession } from '@/lib/auth-client'
import { Role } from '@/lib/constants'

export default function AdminLayout() {
  const { data: session } = useSession()

  if (session?.user.role !== Role.admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
