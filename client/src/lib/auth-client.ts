import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', required: true },
      },
    }),
  ],
})

export const { useSession, signIn, signOut } = authClient
