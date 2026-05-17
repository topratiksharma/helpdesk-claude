import axios from 'axios'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Role } from '@/lib/constants'
import { useSession } from '@/lib/auth-client'
import { type TicketDetailResponse, type AgentsResponse } from '../tickets.types'
import { ReplyThread } from '../reply-thread/ReplyThread'
import { ReplyForm } from '../reply-form/ReplyForm'
import { TicketHeader } from '../ticket-header/TicketHeader'
import { TicketControls } from '../ticket-controls/TicketControls'
import { TicketDetailSkeleton } from '../TicketDetailSkeleton'
import { BackLink } from '@/components/BackLink'
import { EmptyState } from '@/components/EmptyState'


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
