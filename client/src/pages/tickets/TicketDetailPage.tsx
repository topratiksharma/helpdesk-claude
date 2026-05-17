import axios from 'axios'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Role } from '@/lib/constants'
import { useSession } from '@/lib/auth-client'
import {
  type TicketDetailResponse,
  type AgentsResponse,
  type CreateMessageInput,
  type MessageSender,
  createMessageSchema,
} from './tickets.types'
import { ReplyThread } from './ReplyThread'
import { TicketHeader } from './TicketHeader'
import { TicketControls } from './TicketControls'
import { TicketDetailSkeleton } from './TicketDetailSkeleton'
import { BackLink } from '@/components/BackLink'
import { ErrorAlert } from '@/components/ErrorAlert'
import { EmptyState } from '@/components/EmptyState'

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
        <ErrorAlert message={errors.root.message!} />
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={replyMutation.isPending} size="sm">
          {replyMutation.isPending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </form>
  )
}


export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
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

  const ticket = data?.ticket
  const agents = agentsData?.agents ?? []

  if (isPending) {
    return <TicketDetailSkeleton />
  }

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      <BackLink to="/tickets" label="Tickets" />

      {isError || !ticket ? (
        <EmptyState message="Ticket not found." />
      ) : (
        <div className="flex gap-8 items-start">
          {/* ── Left: subject + message thread ── */}
          <div className="flex-1 min-w-0">
            <TicketHeader id={ticket.id} subject={ticket.subject} status={ticket.status} />

            <ReplyThread messages={ticket.messages} />

            <ReplyForm ticketId={ticket.id} />
          </div>

          {/* ── Right: controls ── */}
          <TicketControls ticketId={id!} ticket={ticket} isAdmin={isAdmin} agents={agents} />
        </div>
      )}
    </div>
  )
}
