import axios from 'axios'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { type User } from './users.types'
import { UserForm } from './user-form/UserForm'
import { UsersTable } from './user-table/UsersTable'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ErrorAlert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function UsersPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [dialogUser, setDialogUser] = useState<User | undefined | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
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
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to delete user.')
        : 'Failed to delete user.'
      setDeleteError(message)
      setDeleteTarget(null)
    },
  })

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
        <Button onClick={() => setDialogUser(undefined)}>
          <UserPlus size={15} strokeWidth={1.8} />
          Add user
        </Button>
      </div>

      {error && (
        <ErrorAlert className="mb-6" message={error} />
      )}

      <UsersTable
        users={data ?? []}
        loading={isPending}
        currentUserId={session?.user.id}
        onDelete={setDeleteTarget}
        onEdit={setDialogUser}
      />

      <Dialog open={dialogUser !== null} onOpenChange={(open) => { if (!open) setDialogUser(null) }}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{dialogUser ? 'Edit user' : 'Add user'}</DialogTitle>
          </DialogHeader>
          <UserForm key={dialogUser?.id ?? 'new'} user={dialogUser ?? undefined} onSuccess={() => setDialogUser(null)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user and revoke their access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
