import { createAuthClient } from 'better-auth/react'

import { resolvePublicOrigin } from '#lib/public-origin'

const authClient = createAuthClient({
  baseURL: resolvePublicOrigin(),
  fetchOptions: {
    credentials: 'include',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  }
})

export { authClient }
