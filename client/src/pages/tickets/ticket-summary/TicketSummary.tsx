import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ErrorAlert'
import { type SummarizeTicketResponse } from '@helpdesk/core'

export function TicketSummary({ ticketId }: { ticketId: number }) {
  const summarizeMutation = useMutation({
    mutationFn: () =>
      axios
        .post<SummarizeTicketResponse>(
          `/api/tickets/${ticketId}/summarize`,
          {},
          { withCredentials: true },
        )
        .then((r) => r.data),
    onError: () => {},
  })

  const errorMessage = summarizeMutation.isError
    ? axios.isAxiosError(summarizeMutation.error)
      ? (summarizeMutation.error.response?.data?.error ?? 'Failed to summarize ticket.')
      : 'Failed to summarize ticket.'
    : null

  const buttonLabel = summarizeMutation.isPending
    ? 'Summarizing…'
    : summarizeMutation.data
      ? 'Regenerate'
      : 'Summarize'

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
          Summary
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={summarizeMutation.isPending}
          onClick={() => summarizeMutation.mutate()}
        >
          <Sparkles size={14} strokeWidth={1.8} />
          {buttonLabel}
        </Button>
      </div>

      {summarizeMutation.isPending && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      )}

      {summarizeMutation.data && !summarizeMutation.isPending && (
        <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-md px-3 py-2.5">
          {summarizeMutation.data.summary}
        </p>
      )}

      {errorMessage && <ErrorAlert message={errorMessage} />}
    </div>
  )
}
