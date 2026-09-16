import { meetingShareDetailQueryOptions } from '@repo/api-client/v1/share/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { MeetingSharePage } from '#components/pages/meeting-share-page'

export const Route = createFileRoute('/share/$shareSlug')({
  loader: async ({ context: { queryClient }, params: { shareSlug } }) => {
    await queryClient
      .ensureQueryData(meetingShareDetailQueryOptions(shareSlug))
      .catch(() => undefined)
  },
  component: MeetingShareRoute
})

function MeetingShareRoute() {
  const { shareSlug } = Route.useParams()
  return <MeetingSharePage shareSlug={shareSlug} />
}
