import { Pencil, Trash2 } from 'lucide-react'
import { type User } from './users.types'
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
import { formatDate } from '@/lib/utils'

interface UsersTableProps {
  users: User[]
  loading: boolean
  currentUserId: string | undefined
  onDelete: (user: User) => void
  onEdit: (user: User) => void
}

const columns = (
  <TableRow>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Name</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Email</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Role</TableHead>
    <TableHead className="text-xs text-muted-foreground uppercase tracking-[0.06em]">Date Joined</TableHead>
    <TableHead />
  </TableRow>
)

export function UsersTable({ users, loading, currentUserId, onDelete, onEdit }: UsersTableProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>{columns}</TableHeader>
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
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        No users yet. Add one to get started.
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-md overflow-hidden">
      <Table>
        <TableHeader>{columns}</TableHeader>
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
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                    aria-label={`Edit ${user.name}`}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <Pencil size={14} strokeWidth={1.8} />
                  </Button>
                  {user.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={user.id === currentUserId}
                      onClick={() => onDelete(user)}
                      aria-label={`Delete ${user.name}`}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
