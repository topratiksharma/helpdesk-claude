import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type User, createUserSchema } from './users.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const editFormSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
  email: z.email('Please enter a valid email address'),
  password: z.string().refine(
    (val) => val === '' || (val.length >= 8 && /^\S+$/.test(val)),
    { message: 'Password must be at least 8 characters with no spaces' },
  ),
})

type UserFormValues = { name: string; email: string; password: string }

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
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEditing ? editFormSchema : createUserSchema),
    defaultValues: isEditing
      ? { name: user.name, email: user.email, password: '' }
      : { name: '', email: '', password: '' },
  })

  const createUser = useMutation({
    mutationFn: (values: UserFormValues) =>
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

  const editUser = useMutation({
    mutationFn: (values: UserFormValues) => {
      const payload: Record<string, string> = { name: values.name, email: values.email }
      if (values.password) payload.password = values.password
      return axios.patch(`/api/users/${user!.id}`, payload, { withCredentials: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to update user.')
        : 'Failed to update user.'
      setError('root', { message })
    },
  })

  const isPending = createUser.isPending || editUser.isPending

  function onSubmit(values: UserFormValues) {
    if (isEditing) {
      editUser.mutate(values)
    } else {
      createUser.mutate(values)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <div
            role="alert"
            className="bg-destructive/10 border border-destructive/20 rounded-sm px-3.5 py-2.5 text-[13px] text-destructive"
          >
            {errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || isPending} className="w-full">
          {isPending
            ? isEditing ? 'Saving…' : 'Creating…'
            : isEditing ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}
