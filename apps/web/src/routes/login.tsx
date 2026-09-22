import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginPage } from '#components/auth/login-page'
import { authClient } from '#lib/auth-client'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (data) {
      throw redirect({ to: '/meetings' })
    }
  },
  component: LoginPage
})
