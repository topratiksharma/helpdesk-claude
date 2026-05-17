import axios from 'axios'
import { type ElementType, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, Tag, UserCheck, Calendar, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatDateTime } from '@/lib/utils'
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES, Role } from '@/lib/constants'
import { useSession } from '@/lib/auth-client'
import {
  type TicketDetailResponse,
  type AgentsResponse,
  type TicketCategory,
  type TicketStatus,
  type CreateMessageInput,
  type MessageSender,
  createMessageSchema,
} from './tickets.types'
import { ReplyThread } from './ReplyThread'

function ReplyForm({ ticketId }: { ticketId: number }) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const role = session?.user?.role
  const sender: MessageSender = role === Role.admin || role === Role.agent ? 'agent' : 'customer'

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { body: '', sender },
  })

  useEffect(() => {
    setValue('sender', sender)
  }, [sender, setValue])

  const replyMutation = useMutation({
    mutationFn: (values: CreateMessageInput) =>
      axios.post(`/api/tickets/${ticketId}/messages`, values, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', String(ticketId)] })
      reset({ body: '', sender })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to send reply.')
        : 'Failed to send reply.'
      setError('root', { message })
    },
  })

  return (
    <form
      onSubmit={handleSubmit((values) => replyMutation.mutate(values))}
      noValidate
      className="mt-6 pt-6 border-t border-border flex flex-col gap-3"
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
        Reply
      </span>

      <div className="flex flex-col gap-1">
        <Textarea
          placeholder="Write a reply…"
          rows={4}
          aria-invalid={!!errors.body}
          {...register('body')}
        />
        {errors.body && (
          <span className="text-xs text-destructive">{errors.body.message}</span>
        )}
      </div>

      {errors.root && (
        <div
          role="alert"
          className="bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={replyMutation.isPending} size="sm">
          {replyMutation.isPending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </form>
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
        <Skeleton className="h-4 w-20 mb-8" />
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-9 w-[380px] mb-8" />
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn('flex gap-3', i % 2 === 1 && 'flex-row-reverse')}>
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className="h-16 w-64 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-64 shrink-0 rounded-md border border-border divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
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

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft size={13} />
        Tickets
      </button>

      <div className="flex gap-8 items-start">
        {/* ── Left: subject + message thread ── */}
        <div className="flex-1 min-w-0">
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

          <ReplyThread messages={ticket.messages} />

          <ReplyForm ticketId={ticket.id} />
        </div>

        {/* ── Right: metadata sidebar ── */}
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
          </div>

          <div className="px-4 py-3">
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
      </div>
    </div>
  )
}
