import axios from 'axios'
import { type ElementType } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, User, Tag, UserCheck, Calendar, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES, Role } from '@/lib/constants'
import { useSession } from '@/lib/auth-client'
import {
  type TicketDetailResponse,
  type Message,
  type AgentsResponse,
  type TicketCategory,
  type TicketStatus,
} from './tickets.types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function getDayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.08em] font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.sender === 'agent'
  const name = isAgent ? (message.author?.name ?? 'Agent') : 'Customer'

  return (
    <div className={cn('flex gap-3', isAgent ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 select-none',
          isAgent
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border',
        )}
      >
        {getInitials(name)}
      </div>
      <div className={cn('flex flex-col gap-1 max-w-[74%]', isAgent && 'items-end')}>
        <div className={cn('flex items-baseline gap-2', isAgent && 'flex-row-reverse')}>
          <span className="text-xs font-medium text-foreground">{name}</span>
          <span className="text-[11px] text-muted-foreground/60">
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            'px-3.5 py-2.5 text-sm leading-relaxed',
            isAgent
              ? 'bg-primary text-primary-foreground rounded-xl rounded-tr-sm'
              : 'bg-muted/60 border border-border text-foreground rounded-xl rounded-tl-sm',
          )}
        >
          {message.body}
        </div>
      </div>
    </div>
  )
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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const isAdmin = session?.user.role === Role.admin

  const { data, isPending, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios
        .get<TicketDetailResponse>(`/api/tickets/${id}`, { withCredentials: true })
        .then((res) => res.data),
    enabled: !!id,
    retry: (count, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false
      return count < 2
    },
  })

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () =>
      axios
        .get<AgentsResponse>('/api/agents', { withCredentials: true })
        .then((res) => res.data),
    enabled: isAdmin,
  })

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch(
        `/api/tickets/${id}`,
        { assignedToId },
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) =>
      axios.patch(
        `/api/tickets/${id}`,
        { status },
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })

  const categoryMutation = useMutation({
    mutationFn: (category: TicketCategory | null) =>
      axios.patch(
        `/api/tickets/${id}`,
        { category },
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })

  const ticket = data?.ticket
  const agents = agentsData?.agents ?? []

  if (isPending) {
    return (
      <div className="animate-fade-up max-w-5xl mx-auto">
        <Skeleton className="h-4 w-20 mb-10" />
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-3.5 w-8" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-[440px] mb-6" />
        <div className="grid grid-cols-5 gap-4 p-4 rounded-md border border-border mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 1 && 'flex-row-reverse')}>
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <Skeleton className="h-16 w-64 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="animate-fade-up max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={13} />
          Tickets
        </button>
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
      </div>
    )
  }

  const messagesByDay: { dayKey: string; dayLabel: string; messages: Message[] }[] = []
  for (const msg of ticket.messages) {
    const dayKey = new Date(msg.createdAt).toDateString()
    const last = messagesByDay[messagesByDay.length - 1]
    if (last && last.dayKey === dayKey) {
      last.messages.push(msg)
    } else {
      messagesByDay.push({ dayKey, dayLabel: getDayLabel(msg.createdAt), messages: [msg] })
    }
  }

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft size={13} />
        Tickets
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-xs text-muted-foreground/60 tracking-wide">
            #{ticket.id}
          </span>
          <Badge variant="outline" className={STATUS_STYLES[ticket.status]}>
            {ticket.status}
          </Badge>
        </div>
        <h1 className="font-display text-[28px] font-medium text-foreground tracking-[-0.02em] leading-[1.2]">
          {ticket.subject}
        </h1>
      </div>

      <div className="bg-muted/40 rounded-md border border-border mb-8">
        <div className="grid grid-cols-5 gap-4 px-4 py-3.5">
          <MetaItem icon={User} label="From">
            <p className="text-sm text-foreground truncate" title={`${ticket.fromName} · ${ticket.fromEmail}`}>
              {ticket.fromName} · {ticket.fromEmail}
            </p>
          </MetaItem>
          <MetaItem icon={Calendar} label="Last updated">
            <p className="text-sm text-foreground">{formatDateTime(ticket.updatedAt)}</p>
          </MetaItem>
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
                {(Object.entries(STATUS_LABELS) as [TicketStatus, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {statusMutation.isError && (
              <p className="text-[11px] text-destructive mt-0.5">Failed to update.</p>
            )}
          </MetaItem>
          <MetaItem icon={Tag} label="Category">
            {isAdmin ? (
              <>
                <Select
                  value={ticket.category ?? 'none'}
                  onValueChange={(value) =>
                    categoryMutation.mutate(value === 'none' ? null : value as TicketCategory)
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

      <div className="space-y-4">
        {ticket.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No messages yet.</p>
        ) : (
          messagesByDay.map(({ dayKey, dayLabel, messages }) => (
            <div key={dayKey} className="space-y-4">
              <DaySeparator label={dayLabel} />
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
