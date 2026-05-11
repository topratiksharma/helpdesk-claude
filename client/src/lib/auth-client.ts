import { createAuthClient } from 'better-auth/react'

const authClient = createAuthClient()

export const { useSession, signIn, signOut } = authClient
