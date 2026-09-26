import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { useMeetingsUpcomingQuery } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { GoogleMark } from '#components/auth/google-mark'
import { UpcomingMeetingRow } from '#components/meetings/upcoming-meeting-row'
import { useNow } from '#hooks/use-now'
import { authClient } from '#lib/auth-client'
import { groupMeetingsByDay } from '#lib/meeting-day-groups'

const GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.readonly'

const authenticatedRoute = getRouteApi('/_authenticated')

function UpcomingCallsPage() {
  const { session } = authenticatedRoute.useRouteContext()
  const now = useNow()
  const { data: statusData, isPending: statusPending, isError: statusError, refetch: refetchStatus } =
    useCalendarStatusQuery()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const connected = statusData?.success === true && statusData.data.connected

  const {
    data: upcomingData,
    isPending: upcomingPending,
    isError: upcomingError,
    refetch: refetchUpcoming
  } = useMeetingsUpcomingQuery({ enabled: connected === true })

  async function handleConnectCalendar() {
    setIsConnecting(true)
    setConnectError(null)

    const { error } = await authClient.linkSocial({
      provider: 'google',
      scopes: [GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE],
      callbackURL: '/meetings/upcoming'
    })

    if (error) {
      setConnectError(error.message ?? 'Could not connect Google Calendar.')
      setIsConnecting(false)
    }
  }

  const upcomingMeetings =
    upcomingData?.success === true ? upcomingData.data.meetings : []

  const groups = groupMeetingsByDay(upcomingMeetings, now)

  if (statusPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-16">
        <Loader2 aria-hidden className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Checking calendar status…</p>
      </div>
    )
  }

  if (statusError || (statusData && !statusData.success)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <p className="text-destructive text-sm">Could not load calendar status.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void refetchStatus()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div
            className="bg-card text-muted-foreground ring-border flex size-20 items-center justify-center rounded-3xl shadow-sm ring-1"
            aria-hidden
          >
            <CalendarDays className="size-9" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Connect your calendar
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Link Google Calendar so Fathom can automatically capture and take notes on your video calls ({' '}
              <span className="text-foreground font-medium">{session.user.email}</span>
              ).
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            disabled={isConnecting}
            className="min-w-56"
            onClick={() => {
              void handleConnectCalendar()
            }}
          >
            {isConnecting ? <Loader2 className="animate-spin" /> : <GoogleMark />}
            Connect Google Calendar
          </Button>
          {connectError ? (
            <p className="text-destructive text-sm">{connectError}</p>
          ) : null}
        </div>
      </div>
    )
  }

  if (upcomingPending) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2.5 py-24">
        <Loader2 aria-hidden className="text-muted-foreground size-5 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading upcoming calls…</p>
      </div>
    )
  }

  if (upcomingError || (upcomingData && !upcomingData.success)) {
    return (
      <div className="border-destructive/20 bg-destructive/5 mx-auto my-8 flex max-w-md flex-col items-center gap-3 rounded-xl border p-10 text-center">
        <p className="text-destructive text-sm font-medium">Could not load upcoming calls.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void refetchUpcoming()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
      {upcomingMeetings.length === 0 ? (
        <div className="border-border/60 bg-card/40 rounded-xl border p-12 text-center">
          <p className="text-foreground text-sm font-semibold">No upcoming calls</p>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-xs leading-relaxed">
            Only meetings in the next 2 days with a video link are synced. Future calls appear here until they finish or the scheduled end time passes.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-3">
              <h3 className="text-muted-foreground font-sans text-xs font-semibold tracking-wider uppercase">
                {group.label}
              </h3>
              <ul className="border-border border-t">
                {group.meetings.map((meeting: MeetingListItem) => (
                  <UpcomingMeetingRow key={meeting.id} meeting={meeting} />
                ))}
              </ul>
            </section>
          ))}
          <p className="text-muted-foreground text-xs">
            Only meetings up to 2 days ahead are synced from your calendar.
          </p>
        </div>
      )}
    </div>
  )
}

export { UpcomingCallsPage }
