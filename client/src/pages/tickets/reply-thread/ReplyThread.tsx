import DOMPurify from 'dompurify'
import { cn, formatDateTime } from '@/lib/utils'
import { type Message } from '../tickets.types'
import { EmptyState } from '@/components/EmptyState'

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
            'px-3.5 py-2.5 text-sm leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0',
            isAgent
              ? 'bg-primary text-primary-foreground rounded-xl rounded-tr-sm'
              : 'bg-muted/60 border border-border text-foreground rounded-xl rounded-tl-sm',
          )}
          {...(message.htmlBody
            ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(message.htmlBody) } }
            : { children: message.body }
          )}
        />
      </div>
    </div>
  )
}

export function ReplyThread({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <EmptyState message="No messages yet." className="text-center py-10" />
    )
  }

  const messagesByDay: { dayKey: string; dayLabel: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const dayKey = new Date(msg.createdAt).toDateString()
    const last = messagesByDay[messagesByDay.length - 1]
    if (last && last.dayKey === dayKey) {
      last.messages.push(msg)
    } else {
      messagesByDay.push({ dayKey, dayLabel: getDayLabel(msg.createdAt), messages: [msg] })
    }
  }

  return (
    <div className="space-y-4">
      {messagesByDay.map(({ dayKey, dayLabel, messages: dayMessages }) => (
        <div key={dayKey} className="space-y-4">
          <DaySeparator label={dayLabel} />
          {dayMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      ))}
    </div>
  )
}
