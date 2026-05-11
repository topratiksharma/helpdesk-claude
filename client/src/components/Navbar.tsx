import { useNavigate } from 'react-router'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface NavbarProps {
  user: { name: string; email: string }
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-primary flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6A1.5 1.5 0 0 1 13.5 12H10l-3 3v-3H4.5A1.5 1.5 0 0 1 3 10.5v-6Z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </div>
          <span className="font-display text-lg font-medium text-foreground tracking-[-0.01em]">
            Helpdesk
          </span>
        </div>

        {/* User + sign out */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-primary-foreground leading-none uppercase">
              {user.name.charAt(0)}
            </span>
          </div>

          <span className="text-[13.5px] text-muted-foreground max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
            {user.name}
          </span>

          <div className="w-px h-4 bg-border" />

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut size={14} strokeWidth={1.8} />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
