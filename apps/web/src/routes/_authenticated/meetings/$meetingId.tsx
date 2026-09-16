import { meetingDetailQueryOptions } from '@repo/api-client/v1/meetings/hooks'
import { createFileRoute } from '@tanstack/react-router'

import { MeetingPlaybackPage } from '#components/pages/meeting-playback-page'

export const Route = createFileRoute('/_authenticated/meetings/$meetingId')({
  loader: async ({ context: { queryClient }, params: { meetingId } }) => {
    await queryClient
      .ensureQueryData(meetingDetailQueryOptions(meetingId))
      .catch(() => undefined)
  },
  component: MeetingPlaybackRoute
})

function MeetingPlaybackRoute() {
  const { meetingId } = Route.useParams()
  return <MeetingPlaybackPage meetingId={meetingId} />
}
