import { calendarStatusQueryOptions } from '@repo/api-client/v1/calendar/hooks'
import {
  meetingsCompletedQueryOptions,
  meetingsUpcomingQueryOptions
} from '@repo/api-client/v1/meetings/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { MyCallsPage } from '#components/pages/my-calls-page'

export const Route = createFileRoute('/_authenticated/meetings/my-calls')({
  loader: async ({ context: { queryClient } }) => {
    const status = await queryClient
      .ensureQueryData(calendarStatusQueryOptions())
      .catch(() => undefined)

    if (status?.success === true && status.data.connected) {
      await Promise.all([
        queryClient
          .ensureQueryData(meetingsCompletedQueryOptions())
          .catch(() => undefined),
        queryClient
          .ensureQueryData(meetingsUpcomingQueryOptions())
          .catch(() => undefined)
      ])
    }
  },
  component: MyCallsPage
})
