import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import {
  useMeetingsCompletedQuery,
  useMeetingsUpcomingQuery
} from '@repo/api-client/v1/meetings/hooks'
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
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { GoogleMark } from '#components/auth/google-mark'
import { CalendarSyncButton } from '#components/meetings/calendar-sync-button'
import { UpcomingHeroCard } from '#components/meetings/upcoming-hero-card'
import { UpcomingMeetingRow } from '#components/meetings/upcoming-meeting-row'
import { UpcomingSummaryCard } from '#components/meetings/upcoming-summary-card'
import { useNow } from '#hooks/use-now'
import { authClient } from '#lib/auth-client'
import { getGreeting } from '#lib/format-meeting-time'
import {
  getMeetingDayGroupLabel,
  groupMeetingsByDay
} from '#lib/meeting-day-groups'

const GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.readonly'

const authenticatedRoute = getRouteApi('/_authenticated')

function UpcomingCallsPage() {
  const { session } = authenticatedRoute.useRouteContext()
  const now = useNow()
  const {
    data: statusData,
    isPending: statusPending,
    isError: statusError,
    refetch: refetchStatus
  } = useCalendarStatusQuery()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const connected = statusData?.success === true && statusData.data.connected

  const {
    data: upcomingData,
    isPending: upcomingPending,
    isError: upcomingError,
    refetch: refetchUpcoming
  } = useMeetingsUpcomingQuery({ enabled: connected === true })

  const { data: completedData } = useMeetingsCompletedQuery({
    enabled: connected === true
  })

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

  const completedMeetings =
    completedData?.success === true ? completedData.data.meetings : []

  const todayUpcomingCount = upcomingMeetings.filter(
    (m) => getMeetingDayGroupLabel(m.startTime, now) === 'Today'
  ).length

  const tomorrowUpcomingCount = upcomingMeetings.filter(
    (m) => getMeetingDayGroupLabel(m.startTime, now) === 'Tomorrow'
  ).length

  const todayCompletedCount = completedMeetings.filter(
    (m) => getMeetingDayGroupLabel(m.startTime, now) === 'Today'
  ).length

  const todayTotalCount = todayUpcomingCount + todayCompletedCount
  const totalUpcomingCount = upcomingMeetings.length

  const sortedUpcoming = [...upcomingMeetings].sort(
    (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)
  )
  const nextMeeting = sortedUpcoming[0]

  const greeting = getGreeting(new Date(now))
  const firstName = session.user.name
    ? session.user.name.trim().split(/\s+/)[0]
    : undefined

  const groups = groupMeetingsByDay(upcomingMeetings, now)

  if (statusPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-16">
        <Loader2
          aria-hidden
          className="text-muted-foreground size-8 animate-spin"
        />
        <p className="text-muted-foreground text-sm">
          Checking calendar status…
        </p>
      </div>
    )
  }

  if (statusError || (statusData && !statusData.success)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <p className="text-destructive text-sm">
          Could not load calendar status.
        </p>
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
              Link Google Calendar so Fathom can automatically capture and take
              notes on your video calls ({' '}
              <span className="text-foreground font-medium">
                {session.user.email}
              </span>
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
            {isConnecting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GoogleMark />
            )}
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
        <Loader2
          aria-hidden
          className="text-muted-foreground size-5 animate-spin"
        />
        <p className="text-muted-foreground text-sm">Loading upcoming calls…</p>
      </div>
    )
  }

  if (upcomingError || (upcomingData && !upcomingData.success)) {
    return (
      <div className="border-destructive/20 bg-destructive/5 mx-auto my-8 flex max-w-md flex-col items-center gap-3 rounded-xl border p-10 text-center">
        <p className="text-destructive text-sm font-medium">
          Could not load upcoming calls.
        </p>
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
        <div className="w-full py-8">
          <Empty className="bg-muted/40 min-h-[500px] w-full border-0 p-12 md:min-h-[580px] md:p-20">
            <EmptyHeader className="max-w-lg">
              <EmptyMedia variant="icon">
                <CalendarDays className="text-muted-foreground size-6" />
              </EmptyMedia>
              <EmptyTitle className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                Hmm.. your calendar is quiet
              </EmptyTitle>
              <EmptyDescription className="text-muted-foreground text-sm leading-relaxed">
                Only meetings in the next 2 days with a video link are synced.
                If you just scheduled or updated a call, sync your calendar to
                capture it.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-md">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <CalendarSyncButton
                  size="default"
                  className="rounded-full px-5"
                />
                <Button
                  render={
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noreferrer noopener"
                    />
                  }
                  variant="link"
                  size="default"
                  className="gap-2 rounded-full px-5"
                >
                  <ExternalLink className="size-4" />
                  <span>Open Google Calendar</span>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="pb-1">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </h1>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            {nextMeeting ? (
              <div className="lg:col-span-2">
                <UpcomingHeroCard meeting={nextMeeting} nowMs={now} />
              </div>
            ) : null}

            <div className={nextMeeting ? 'lg:col-span-1' : 'lg:col-span-3'}>
              <UpcomingSummaryCard
                todayTotalCount={todayTotalCount}
                todayUpcomingCount={todayUpcomingCount}
                todayCompletedCount={todayCompletedCount}
                tomorrowUpcomingCount={tomorrowUpcomingCount}
                totalUpcomingCount={totalUpcomingCount}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-2">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <h3 className="text-foreground text-base font-semibold tracking-tight sm:text-lg">
                All upcoming calls ({upcomingMeetings.length})
              </h3>
              <span className="text-muted-foreground text-xs">Next 2 days</span>
            </div>

            <div className="flex flex-col gap-8">
              {groups.map((group) => (
                <section key={group.label} className="flex flex-col gap-3">
                  <h4 className="text-muted-foreground font-sans text-xs font-semibold tracking-wider uppercase">
                    {group.label}
                  </h4>
                  <ul className="border-border border-t">
                    {group.meetings.map((meeting: MeetingListItem) => (
                      <UpcomingMeetingRow key={meeting.id} meeting={meeting} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <p className="text-muted-foreground text-xs">
              Only meetings up to 2 days ahead are synced from your calendar.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export { UpcomingCallsPage }
