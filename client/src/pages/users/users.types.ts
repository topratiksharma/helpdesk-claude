export type { User, UserRole, CreateUserInput as AddUserFormValues } from '@helpdesk/core'
export { createUserSchema as addUserSchema } from '@helpdesk/core'

export interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
