import axios from 'axios'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Trash2 } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'agent'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

// ─── Add User dialog ──────────────────────────────────────────────────────────

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'agent']),
})

type AddUserFormValues = z.infer<typeof addUserSchema>

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: 'agent' },
  })

  async function onSubmit(values: AddUserFormValues) {
    try {
      await axios.post('/api/users', values, { withCredentials: true })
      reset()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to create user.')
        : 'Failed to create user.'
      setError('root', { message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                placeholder="Jane Smith"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <span className="text-xs text-destructive">{errors.name.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-email">Email address</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="jane@company.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <span className="text-xs text-destructive">{errors.email.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Min. 8 characters"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <span className="text-xs text-destructive">{errors.password.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="add-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {errors.root && (
              <div
                role="alert"
                className="bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
              >
                {errors.root.message}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full mt-1">
              {isSubmitting ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get<{ users: User[] }>('/api/users', { withCredentials: true })
      setUsers(data.users)
    } catch {
      setError('Could not load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleDelete(user: User) {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return
    try {
      await axios.delete(`/api/users/${user.id}`, { withCredentials: true })
      fetchUsers()
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to delete user.')
        : 'Failed to delete user.'
      setError(message)
    }
  }

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
        <div className="flex justify-center py-16">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin text-muted-foreground">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
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

      <AddUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
