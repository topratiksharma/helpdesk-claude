import { z } from 'zod'

export type UserRole = 'admin' | 'agent'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export const addUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^\S+$/, 'Password must not contain spaces'),
})

export type AddUserFormValues = z.infer<typeof addUserSchema>

export interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
