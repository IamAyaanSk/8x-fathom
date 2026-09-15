import {
  useCalendarStatusQuery,
  useCalendarSyncMutation
} from '@repo/api-client/v1/calendar/hooks'
import { Button } from '@repo/ui-web/components/button'
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { GoogleMark } from '#components/auth/google-mark'
import { authClient } from '#lib/auth-client'

const GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.readonly'

const authenticatedRoute = getRouteApi('/_authenticated')

function HomePage() {
  const { session } = authenticatedRoute.useRouteContext()
  const { data, isPending, isError, refetch } = useCalendarStatusQuery()
  const syncMutation = useCalendarSyncMutation()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const connected = data?.success === true && data.data.connected

  async function handleConnectCalendar() {
    setIsConnecting(true)
    setConnectError(null)

    const { error } = await authClient.linkSocial({
      provider: 'google',
      scopes: [GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE],
      callbackURL: '/'
    })

    if (error) {
      setConnectError(error.message ?? 'Could not connect Google Calendar.')
      setIsConnecting(false)
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-16">
        <Loader2
          aria-hidden
          className="text-muted-foreground size-8 animate-spin"
        />
        <p className="text-muted-foreground text-sm">Checking calendar…</p>
      </div>
    )
  }

  if (isError || (data && !data.success)) {
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
            void refetch()
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
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Connect your calendar to continue
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Link Google Calendar so we can find upcoming calls with video
              links. Signed in as{' '}
              <span className="text-foreground">{session.user.email}</span>.
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch()
            }}
          >
            Refresh status
          </Button>
        </div>
      </div>
    )
  }

  const syncMessage =
    syncMutation.data?.success === true
      ? `Synced ${syncMutation.data.data.syncedCount} meeting${
          syncMutation.data.data.syncedCount === 1 ? '' : 's'
        }.`
      : syncMutation.data && !syncMutation.data.success
        ? 'Sync failed. Try again.'
        : null

      console.error(syncMutation.error)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            Upcoming
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncMutation.isPending}
            onClick={() => {
              syncMutation.reset()
              syncMutation.mutate()
            }}
          >
            {syncMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            Sync now
          </Button>
        </div>
        {syncMutation.isError ? (
          <p className="text-destructive text-sm">Could not sync calendar.</p>
        ) : null}
        {syncMessage ? (
          <p className="text-muted-foreground text-sm">{syncMessage}</p>
        ) : null}
        <div
          className="bg-card border-border flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center"
        >
          <p className="text-foreground text-sm font-medium">
            Your meeting list is on the way
          </p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Calendar is connected. Recordable meetings from the next 7 days will
            show up here after sync.
          </p>
        </div>
      </section>
    </div>
  )
}

export { HomePage }
