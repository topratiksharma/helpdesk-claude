import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function TicketDetailSkeleton() {
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
