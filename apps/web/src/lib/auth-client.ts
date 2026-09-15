import { createAuthClient } from 'better-auth/react'

import { env } from '#src/env'

const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  fetchOptions: {
    credentials: 'include'
  }
})

export { authClient }
