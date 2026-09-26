import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { useMeetingsCompletedQuery } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { Loader2 } from 'lucide-react'

import { MyCallsGrid } from '#components/meetings/my-calls-grid'
import { useIsDemoUser } from '#hooks/use-is-demo'
import { useNow } from '#hooks/use-now'

function MyCallsPage() {
  const isDemo = useIsDemoUser()
  const now = useNow()
  const { data: statusData, isPending: statusPending } =
    useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected
  const canAccess = connected || isDemo

  const {
    data: completedData,
    isPending: completedPending,
    isError: completedError,
    refetch: refetchCompleted
  } = useMeetingsCompletedQuery({ enabled: canAccess })

  const myCalls: MeetingListItem[] =
    completedData?.success === true ? completedData.data.meetings : []

  const isLoading = statusPending || completedPending

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2.5 py-24">
        <Loader2
          aria-hidden
          className="text-muted-foreground size-5 animate-spin"
        />
        <p className="text-muted-foreground text-sm">
          Loading your calls library…
        </p>
      </div>
    )
  }

  if (completedError || (completedData && !completedData.success)) {
    return (
      <div className="border-destructive/20 bg-destructive/5 mx-auto my-8 flex max-w-md flex-col items-center gap-3 rounded-xl border p-10 text-center">
        <p className="text-destructive text-sm font-medium">
          Could not load calls library.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void refetchCompleted()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
      <MyCallsGrid meetings={myCalls} nowMs={now} />
    </div>
  )
}

export { MyCallsPage }
