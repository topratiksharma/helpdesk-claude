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
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--color-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6A1.5 1.5 0 0 1 13.5 12H10l-3 3v-3H4.5A1.5 1.5 0 0 1 3 10.5v-6Z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-ink)',
              letterSpacing: '-0.01em',
            }}
          >
            Helpdesk
          </span>
        </div>

        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--color-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'white',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {user.name.charAt(0)}
            </span>
          </div>

          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 400,
              color: 'var(--color-ink-muted)',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.name}
          </span>

          <div
            style={{
              width: '1px',
              height: '16px',
              background: 'var(--color-border-dark)',
            }}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            style={{ gap: '6px', color: 'var(--color-ink-muted)' }}
          >
            <LogOut size={14} strokeWidth={1.8} />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
