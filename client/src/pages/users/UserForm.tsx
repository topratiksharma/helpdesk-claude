import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type AddUserFormValues, createUserSchema } from './users.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UserFormProps {
  onSuccess: () => void
}

export function UserForm({ onSuccess }: UserFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormValues>({
    resolver: zodResolver(createUserSchema),
  })

  const createUser = useMutation({
    mutationFn: (values: AddUserFormValues) =>
      axios.post('/api/users', values, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to create user.')
        : 'Failed to create user.'
      setError('root', { message })
    },
  })

  return (
    <form onSubmit={handleSubmit((values) => createUser.mutate(values))} noValidate>
      <div className="flex flex-col gap-3 py-1">
        <div className="flex flex-col gap-1">
          <Label htmlFor="add-name">Name</Label>
          <Input
            id="add-name"
            placeholder="Jane Smith"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <span className="text-xs text-destructive h-3.5 block">{errors.name?.message}</span>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="add-email">Email address</Label>
          <Input
            id="add-email"
            type="email"
            placeholder="jane@company.com"
            autoComplete="off"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <span className="text-xs text-destructive h-3.5 block">{errors.email?.message}</span>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="add-password">Password</Label>
          <Input
            id="add-password"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <span className="text-xs text-destructive h-3.5 block">{errors.password?.message}</span>
        </div>

        {errors.root && (
          <div
            role="alert"
            className="bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
          >
            {errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || createUser.isPending} className="w-full">
          {createUser.isPending ? 'Creating…' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}
