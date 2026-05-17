import { useNavigate, Navigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@helpdesk/core'
import { ErrorAlert } from '@/components/ErrorAlert'

type LoginFormValues = LoginInput

const LogoMark = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
    <path
      d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6A1.5 1.5 0 0 1 13.5 12H10l-3 3v-3H4.5A1.5 1.5 0 0 1 3 10.5v-6Z"
      fill="currentColor"
      fillOpacity="0.9"
    />
  </svg>
)

export default function LoginPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  if (!isPending && session) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: LoginFormValues) {
    const { error: authError } = await signIn.email(values)
    if (authError) {
      setError('root', {
        message: authError.message ?? 'Invalid credentials. Please try again.',
      })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* ---- LEFT BRAND PANEL ---- */}
      <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] shrink-0 relative bg-primary overflow-hidden p-12">
        {/* Dot-grid texture overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Decorative rings */}
        <div aria-hidden className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full border border-white/15" />
        <div aria-hidden className="absolute -bottom-14 -right-14 w-60 h-60 rounded-full border border-white/10" />
        <div aria-hidden className="absolute top-40 -left-24 w-56 h-56 rounded-full bg-white/[0.04] blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[7px] bg-white/20 flex items-center justify-center shrink-0">
            <LogoMark className="text-white" />
          </div>
          <span className="font-display text-xl text-white/90 tracking-[-0.01em]">Helpdesk</span>
        </div>

        {/* Tagline — pushed to bottom */}
        <div className="relative mt-auto">
          <h2 className="font-display text-[38px] xl:text-[44px] font-medium text-white leading-[1.15] tracking-[-0.025em] mb-4">
            Support at the speed of your team.
          </h2>
          <p className="text-white/50 text-[13.5px] leading-relaxed">
            Manage customer requests, collaborate with your team, and resolve issues faster.
          </p>
        </div>
      </div>

      {/* ---- RIGHT FORM AREA ---- */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-[380px] animate-fade-up">

          {/* Mobile-only logo */}
          <div className="flex items-center justify-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-[8px] bg-primary flex items-center justify-center shrink-0">
              <LogoMark className="text-white" />
            </div>
            <span className="font-display text-2xl font-medium text-foreground tracking-[-0.01em]">
              Helpdesk
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-[30px] font-medium text-foreground tracking-[-0.02em] leading-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Sign in to your workspace to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <span className="text-xs text-destructive">{errors.email.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <span className="text-xs text-destructive">{errors.password.message}</span>
                )}
              </div>

              {errors.root && (
                <ErrorAlert message={errors.root.message!} />
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full mt-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>

          <p className="text-center mt-8 text-xs text-muted-foreground">
            Contact your administrator for access.
          </p>
        </div>
      </div>
    </div>
  )
}
