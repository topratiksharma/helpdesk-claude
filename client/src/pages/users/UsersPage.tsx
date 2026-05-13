import axios from 'axios'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { type User } from './users.types'
import { UserForm } from './UserForm'
import { UsersTable } from './UsersTable'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function UsersPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
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

  const error = isError ? 'Could not load users. Please try again.' : deleteError

  return (
    <div className="animate-fade-up">
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

      {error && (
        <div
          role="alert"
          className="mb-6 bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
        >
          {error}
        </div>
      )}

      <UsersTable
        users={data ?? []}
        loading={isPending}
        currentUserId={session?.user.id}
        onDelete={handleDelete}
        onEdit={setEditingUser}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <UserForm key={String(dialogOpen)} onSuccess={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editingUser !== null} onOpenChange={(open) => { if (!open) setEditingUser(null) }}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <UserForm key={editingUser?.id} user={editingUser ?? undefined} onSuccess={() => setEditingUser(null)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
