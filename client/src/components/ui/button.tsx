import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-forest)] text-[var(--color-surface)] shadow-sm hover:bg-[var(--color-forest-light)] focus-visible:ring-[var(--color-forest)] active:scale-[0.99]',
        outline:
          'border border-[var(--color-border-dark)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-border)] focus-visible:ring-[var(--color-forest)]',
        ghost:
          'text-[var(--color-ink-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-ink)] focus-visible:ring-[var(--color-forest)]',
        link: 'text-[var(--color-forest)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2 rounded-[var(--radius-md)]',
        sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
        lg: 'h-12 px-8 text-base rounded-[var(--radius-md)]',
        icon: 'h-9 w-9 rounded-[var(--radius-sm)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
