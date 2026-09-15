import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { Button } from '@repo/ui-web/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui-web/components/card'
import { getRouteApi } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { GoogleMark } from '#components/auth/google-mark'
import { authClient } from '#lib/auth-client'

const GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.readonly'

const authenticatedRoute = getRouteApi('/_authenticated')

function HomePage() {
  const { session } = authenticatedRoute.useRouteContext()
  const { data, isPending, isError, refetch } = useCalendarStatusQuery()
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Meetings</h1>
        <p className="text-muted-foreground">
          Signed in as {session.user.email}. Connect Google Calendar to sync
          upcoming events for the next 7 days.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Calendar access is requested separately after sign-in. Your event
            list UI arrives in the next slice.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isPending ? (
            <p className="text-muted-foreground text-sm">Checking connection…</p>
          ) : null}
          {isError || (data && !data.success) ? (
            <p className="text-destructive text-sm">
              Could not load calendar status.
            </p>
          ) : null}
          {connected ? (
            <p className="text-sm">Calendar connected. Events sync after connect.</p>
          ) : (
            <Button
              type="button"
              disabled={isConnecting || isPending}
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
          )}
          {connectError ? (
            <p className="text-destructive text-sm">{connectError}</p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              void refetch()
            }}
          >
            Refresh status
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export { HomePage }
