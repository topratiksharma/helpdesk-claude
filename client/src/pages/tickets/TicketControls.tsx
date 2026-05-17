import axios from 'axios'
import { type ElementType } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Tag, UserCheck, Calendar, Circle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { TicketDetail, TicketStatus, TicketCategory, AgentListItem } from './tickets.types'

interface TicketControlsProps {
  ticketId: string
  ticket: TicketDetail
  isAdmin: boolean
  agents: AgentListItem[]
}

interface MetaItemProps {
  icon: ElementType
  label: string
  children: React.ReactNode
}

function MetaItem({ icon: Icon, label, children }: MetaItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
        <Icon size={11} strokeWidth={2} />
        {label}
      </div>
      {children}
    </div>
  )
}

export function TicketControls({ ticketId, ticket, isAdmin, agents }: TicketControlsProps) {
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) =>
      axios.patch(`/api/tickets/${ticketId}`, { status }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })

  const categoryMutation = useMutation({
    mutationFn: (category: TicketCategory | null) =>
      axios.patch(`/api/tickets/${ticketId}`, { category }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch(`/api/tickets/${ticketId}`, { assignedToId }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })

  return (
    <div className="w-64 shrink-0 sticky top-6 bg-muted/40 rounded-md border border-border divide-y divide-border">
      <div className="px-4 py-3">
        <MetaItem icon={User} label="From">
          <p className="text-sm text-foreground font-medium truncate">{ticket.fromName}</p>
          <p className="text-xs text-muted-foreground truncate">{ticket.fromEmail}</p>
        </MetaItem>
      </div>

      <div className="px-4 py-3">
        <MetaItem icon={Calendar} label="Last updated">
          <p className="text-sm text-foreground">{formatDateTime(ticket.updatedAt)}</p>
        </MetaItem>
      </div>

      <div className="px-4 py-3">
        <MetaItem icon={Circle} label="Status">
          <Select
            value={ticket.status}
            onValueChange={(value) => statusMutation.mutate(value as TicketStatus)}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="h-8 text-sm w-full" aria-label="Ticket status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as [TicketStatus, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusMutation.isError && (
            <p className="text-[11px] text-destructive mt-0.5">Failed to update.</p>
          )}
        </MetaItem>
      </div>

      <div className="px-4 py-3">
        <MetaItem icon={Tag} label="Category">
          {isAdmin ? (
            <>
              <Select
                value={ticket.category ?? 'none'}
                onValueChange={(value) =>
                  categoryMutation.mutate(value === 'none' ? null : (value as TicketCategory))
                }
                disabled={categoryMutation.isPending}
              >
                <SelectTrigger className="h-8 text-sm w-full" aria-label="Ticket category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {(Object.entries(CATEGORY_LABELS) as [TicketCategory, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {categoryMutation.isError && (
                <p className="text-[11px] text-destructive mt-0.5">Failed to update.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-foreground">
              {ticket.category ? CATEGORY_LABELS[ticket.category] : '—'}
            </p>
          )}
        </MetaItem>
      </div>

      <div className="px-4 py-3">
        <MetaItem icon={UserCheck} label="Assigned to">
          {isAdmin ? (
            <>
              <Select
                value={ticket.assignedTo?.id ?? 'unassigned'}
                onValueChange={(value) =>
                  assignMutation.mutate(value === 'unassigned' ? null : value)
                }
                disabled={assignMutation.isPending}
              >
                <SelectTrigger className="h-8 text-sm w-full" aria-label="Assigned agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignMutation.isError && (
                <p className="text-[11px] text-destructive mt-0.5">Failed to update.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-foreground">
              {ticket.assignedTo?.name ?? 'Unassigned'}
            </p>
          )}
        </MetaItem>
      </div>
    </div>
  )
}
