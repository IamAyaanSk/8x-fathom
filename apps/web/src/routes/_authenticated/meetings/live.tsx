import { calendarStatusQueryOptions } from '@repo/api-client/v1/calendar/hooks'
import { meetingsLiveQueryOptions } from '@repo/api-client/v1/meetings/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { LiveCallsPage } from '#components/pages/live-calls-page'

export const Route = createFileRoute('/_authenticated/meetings/live')({
  loader: async ({ context: { queryClient } }) => {
    const status = await queryClient
      .ensureQueryData(calendarStatusQueryOptions())
      .catch(() => undefined)

    if (status?.success === true && status.data.connected) {
      await queryClient
        .ensureQueryData(meetingsLiveQueryOptions())
        .catch(() => undefined)
    }
  },
  component: LiveCallsPage
})
