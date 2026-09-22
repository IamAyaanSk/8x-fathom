import { calendarStatusQueryOptions } from '@repo/api-client/v1/calendar/hooks'
import { postCalendarSync } from '@repo/api-client/v1/calendar/index'
import {
  meetingsCompletedQueryOptions,
  meetingsUpcomingQueryOptions
} from '@repo/api-client/v1/meetings/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '#components/pages/home-page'

export const Route = createFileRoute('/_authenticated/meetings/')({
  loader: async ({ context: { queryClient } }) => {
    const status = await queryClient
      .ensureQueryData(calendarStatusQueryOptions())
      .catch(() => undefined)

    if (status?.success === true && status.data.connected) {
      await postCalendarSync().catch(() => undefined)
      await Promise.all([
        queryClient
          .ensureQueryData(meetingsUpcomingQueryOptions())
          .catch(() => undefined),
        queryClient
          .ensureQueryData(meetingsCompletedQueryOptions())
          .catch(() => undefined)
      ])
    }
  },
  component: HomePage
})
