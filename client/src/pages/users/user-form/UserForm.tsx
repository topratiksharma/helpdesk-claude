import axios from 'axios'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type User, type CreateUserInput, type UpdateUserInput, createUserSchema, updateUserSchema } from '../users.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorAlert } from '@/components/ErrorAlert'

interface UserFormProps {
  onSuccess: () => void
  user?: User
}

export function UserForm({ onSuccess, user }: UserFormProps) {
  const isEditing = !!user
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema) as Resolver<CreateUserInput | UpdateUserInput>,
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: ''
    },
  })

  const saveUser = useMutation({
    mutationFn: (values: CreateUserInput | UpdateUserInput) =>
      isEditing
        ? axios.patch(`/api/users/${user!.id}`, values, { withCredentials: true })
        : axios.post('/api/users', values, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
    },
    onError: (err) => {
      const fallback = isEditing ? 'Failed to update user.' : 'Failed to create user.'
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? fallback)
        : fallback
      setError('root', { message })
    },
  })

  return (
    <form onSubmit={handleSubmit((values) => saveUser.mutate(values))} noValidate>
      <div className="flex flex-col gap-3 py-1">
        <div className="flex flex-col gap-1">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            placeholder="Jane Smith"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <span className="text-xs text-destructive h-3.5 block">{errors.name?.message}</span>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="user-email">Email address</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="jane@company.com"
            autoComplete="off"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <span className="text-xs text-destructive h-3.5 block">{errors.email?.message}</span>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="user-password">Password</Label>
          <Input
            id="user-password"
            type="password"
            placeholder={isEditing ? 'Leave blank to keep current password' : 'Min. 8 characters'}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <span className="text-xs text-destructive h-3.5 block">{errors.password?.message}</span>
        </div>

        {errors.root && (
          <ErrorAlert message={errors.root.message!} />
        )}

        <Button type="submit" disabled={isSubmitting || saveUser.isPending} className="w-full">
          {saveUser.isPending
            ? isEditing ? 'Saving…' : 'Creating…'
            : isEditing ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}
