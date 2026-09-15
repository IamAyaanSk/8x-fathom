import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthenticatedLayout } from '#components/layout/authenticated-layout'
import { authClient } from '#lib/auth-client'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login' })
    }
    return { session: data }
  },
  component: AuthenticatedLayout
})
