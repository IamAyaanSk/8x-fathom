import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { useMeetingsLiveQuery } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@repo/ui-web/components/empty'
import { Link } from '@tanstack/react-router'
import { Loader2, Radio } from 'lucide-react'

import { UpcomingMeetingRow } from '#components/meetings/upcoming-meeting-row'

function LiveCallsPage() {
  const { data: statusData, isPending: statusPending } =
    useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected

  const {
    data: liveData,
    isPending: livePending,
    isError: liveError,
    refetch: refetchLive
  } = useMeetingsLiveQuery({ enabled: connected === true })

  const liveMeetings: MeetingListItem[] =
    liveData?.success === true ? liveData.data.meetings : []

  if (statusPending || livePending) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2.5 py-24">
        <Loader2
          aria-hidden
          className="text-muted-foreground size-5 animate-spin"
        />
        <p className="text-muted-foreground text-sm">
          Checking for active calls…
        </p>
      </div>
    )
  }

  if (liveError || (liveData && !liveData.success)) {
    return (
      <div className="border-destructive/20 bg-destructive/5 mx-auto my-8 flex max-w-md flex-col items-center gap-3 rounded-xl border p-10 text-center">
        <p className="text-destructive text-sm font-medium">
          Could not load live calls.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void refetchLive()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
      {liveMeetings.length === 0 ? (
        <div className="w-full py-8">
          <Empty className="bg-muted/40 min-h-[500px] w-full border-0 p-12 md:min-h-[580px] md:p-20">
            <EmptyHeader className="max-w-lg">
              <EmptyMedia variant="icon">
                <Radio className="text-muted-foreground size-6" />
              </EmptyMedia>
              <EmptyTitle className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                No live calls right now
              </EmptyTitle>
              <EmptyDescription className="text-muted-foreground text-sm leading-relaxed">
                When a bot is in your meeting and recording, the ongoing call
                shows up here in real time.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                render={<Link to="/meetings/upcoming" />}
                variant="outline"
                size="sm"
              >
                View upcoming calls
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-destructive flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <span className="relative flex size-2">
              <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-destructive relative inline-flex size-2 rounded-full" />
            </span>
            <span>Currently Recording ({liveMeetings.length})</span>
          </div>
          <ul className="border-border border-t">
            {liveMeetings.map((meeting: MeetingListItem) => (
              <UpcomingMeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export { LiveCallsPage }
