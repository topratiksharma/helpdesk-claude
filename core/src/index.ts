import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
  email: z.email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^\S+$/, 'Password must not contain spaces'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100).optional(),
    email: z.email('Please enter a valid email address').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^\S+$/, 'Password must not contain spaces')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.name && !data.email && !data.password) {
      ctx.addIssue({ code: 'custom', message: 'At least one field must be provided.' })
    }
  })

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export type UserRole = 'admin' | 'agent'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}
