import axios from 'axios'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Role } from '@/lib/constants'
import { useSession } from '@/lib/auth-client'
import { type CreateMessageInput, type MessageSender, createMessageSchema } from '../tickets.types'
import { type RefineReplyResponse } from '@helpdesk/core'
import { ErrorAlert } from '@/components/ErrorAlert'
import { cn } from '@/lib/utils'

const MAX_REPLY_CHARS = 2000

export function ReplyForm({ ticketId }: { ticketId: number }) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const role = session?.user?.role
  const sender: MessageSender = role === Role.admin || role === Role.agent ? 'agent' : 'customer'

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { body: '', sender },
  })

  const body = watch('body') ?? ''

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

  const refineMutation = useMutation({
    mutationFn: (currentBody: string) =>
      axios
        .post<RefineReplyResponse>('/api/tickets/refine', { body: currentBody }, { withCredentials: true })
        .then((r) => r.data),
    onSuccess: ({ refined }) => {
      setValue('body', refined, { shouldValidate: true })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to refine reply.')
        : 'Failed to refine reply.'
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
        <div className="flex items-center justify-between">
          {errors.body ? (
            <span className="text-xs text-destructive">{errors.body.message}</span>
          ) : (
            <span />
          )}
          <span className={cn(
            'text-xs tabular-nums',
            body.length > MAX_REPLY_CHARS * 0.9 ? 'text-destructive' : 'text-muted-foreground',
          )}>
            {body.length} / {MAX_REPLY_CHARS}
          </span>
        </div>
      </div>

      {errors.root && (
        <ErrorAlert message={errors.root.message!} />
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refineMutation.isPending || !body.trim()}
          onClick={() => refineMutation.mutate(body)}
        >
          <Wand2 size={14} strokeWidth={1.8} />
          {refineMutation.isPending ? 'Refining…' : 'Refine'}
        </Button>
        <Button type="submit" disabled={replyMutation.isPending || !body.trim()} size="sm">
          {replyMutation.isPending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </form>
  )
}
