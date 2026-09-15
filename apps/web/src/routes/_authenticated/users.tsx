import { usersQueryOptions } from '@repo/api-client/v1/users/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { UsersPage } from '#components/pages/users-page'

export const Route = createFileRoute('/_authenticated/users')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersQueryOptions()).catch(() => undefined),
  component: UsersPage
})
