import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { useMeetingsCompletedQuery } from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'

import { MeetingAskFathomSheet } from '#components/meetings/meeting-ask-fathom-sheet'
import { useIsDemoUser } from '#hooks/use-is-demo'

function FloatingAskFathom() {
  const isDemo = useIsDemoUser()
  const { data: statusData } = useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected

  const { data: completedData, isPending: completedPending } =
    useMeetingsCompletedQuery({ enabled: connected === true || isDemo })

  const past =
    completedData?.success === true ? completedData.data.meetings : []
  const hasReadyCalls = past.some((m) => m.uiPhase === 'ready')

  const disabledReason = isDemo
    ? 'Fathom AI is unavailable for the demo account. Sign in with Google for complete access.'
    : completedPending
      ? 'Ask Fathom is available after calls load.'
      : hasReadyCalls
        ? undefined
        : 'Ask Fathom is available after at least one call is processed.'

  const isDemoDisabled = isDemo && disabledReason != null

  return (
    <div className="fixed right-6 bottom-6 z-40">
      <MeetingAskFathomSheet
        disabledReason={disabledReason}
        trigger={
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={disabledReason != null}
            className={
              isDemoDisabled
                ? 'bg-demo/20 text-demo-foreground border-demo/40 h-11 cursor-not-allowed gap-2 rounded-full border px-4.5 py-2.5 text-sm font-semibold tracking-wide shadow-lg'
                : 'border-primary-foreground/20 h-11 cursor-pointer gap-2 rounded-full border px-4.5 py-2.5 text-sm font-semibold tracking-wide shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95'
            }
          >
            {isDemoDisabled ? (
              <span className="text-base leading-none">🧪</span>
            ) : null}
            <span>Ask AI</span>
          </Button>
        }
      />
    </div>
  )
}

export { FloatingAskFathom }
