import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-dark)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:ring-offset-0 focus:border-[var(--color-forest)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-[var(--color-error)] aria-invalid:focus:ring-[var(--color-error)]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
