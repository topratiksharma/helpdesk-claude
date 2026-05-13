import axios from 'axios'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Trash2 } from 'lucide-react'
import { type User } from './users.types'
import { AddUserDialog } from './AddUserDialog'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function UsersPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isPending, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () =>
      axios
        .get<{ users: User[] }>('/api/users', { withCredentials: true })
        .then((res) => res.data.users),
  })

  const deleteUser = useMutation({
    mutationFn: (userId: string) =>
      axios.delete(`/api/users/${userId}`, { withCredentials: true }),
    onSuccess: () => {
      setDeleteError(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to delete user.')
        : 'Failed to delete user.'
      setDeleteError(message)
    },
  })

  async function handleDelete(user: User) {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return
    deleteUser.mutate(user.id)
  }

  const users = data ?? []
  const loading = isPending
  const error = isError ? 'Could not load users. Please try again.' : deleteError

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-[32px] font-medium text-foreground tracking-[-0.02em] leading-[1.2] mb-1.5">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage agents and admins who have access to this workspace.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus size={15} strokeWidth={1.8} />
          Add user
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Email</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Role</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Date Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No users yet. Add one to get started.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Email</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Role</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Date Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-sm">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={user.id === session?.user.id}
                      onClick={() => handleDelete(user)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
