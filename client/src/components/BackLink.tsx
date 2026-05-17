import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

interface BackLinkProps {
  to: string
  label: string
}

export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
    >
      <ArrowLeft size={13} />
      {label}
    </Link>
  )
}
