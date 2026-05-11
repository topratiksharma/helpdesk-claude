import { useNavigate, Navigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

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
    <div className="min-h-dvh flex items-center justify-center px-4 py-16">
      {/* Decorative background grid */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-35 bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      <div className="w-full max-w-[420px] relative animate-fade-up">
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2.5 mb-2">
            {/* Logo mark */}
            <div className="w-9 h-9 rounded-[8px] bg-forest flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6A1.5 1.5 0 0 1 13.5 12H10l-3 3v-3H4.5A1.5 1.5 0 0 1 3 10.5v-6Z"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>
            </div>
            <span className="font-display text-2xl font-medium text-ink tracking-[-0.01em]">
              Helpdesk
            </span>
          </div>
          <p className="text-[13px] text-ink-faint tracking-[0.03em]">
            Sign in to your workspace
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface border border-border rounded-lg p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.6)_inset]">
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
                  <span className="text-xs text-error">{errors.email.message}</span>
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
                  <span className="text-xs text-error">{errors.password.message}</span>
                )}
              </div>

              {errors.root && (
                <div
                  role="alert"
                  className="bg-error-bg border border-[#F0C0C0] rounded-sm px-3.5 py-2.5 text-[13px] text-error flex items-center gap-2"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="shrink-0"
                  >
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="7" cy="10" r="0.75" fill="currentColor" />
                  </svg>
                  {errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full mt-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="animate-spin"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        stroke="currentColor"
                        strokeOpacity="0.25"
                        strokeWidth="2"
                      />
                      <path
                        d="M14 8a6 6 0 0 0-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center mt-6 text-xs text-ink-faint">
          Contact your administrator for access.
        </p>
      </div>
    </div>
  )
}
