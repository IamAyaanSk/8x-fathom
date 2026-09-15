import { calendarStatusQueryOptions } from '@repo/api-client/v1/calendar/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '#components/pages/home-page'

export const Route = createFileRoute('/_authenticated/')({
  loader: ({ context: { queryClient } }) =>
    queryClient
      .ensureQueryData(calendarStatusQueryOptions())
      .catch(() => undefined),
  component: HomePage
})
