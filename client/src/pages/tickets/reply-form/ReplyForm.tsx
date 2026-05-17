import axios from 'axios'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Role } from '@/lib/constants'
import { useSession } from '@/lib/auth-client'
import { type CreateMessageInput, type MessageSender, createMessageSchema } from '../tickets.types'
import { ErrorAlert } from '@/components/ErrorAlert'

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
