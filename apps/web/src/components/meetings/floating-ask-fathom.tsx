import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { useMeetingsCompletedQuery } from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'
import { Sparkles } from 'lucide-react'

import { MeetingAskFathomSheet } from '#components/meetings/meeting-ask-fathom-sheet'

function FloatingAskFathom() {
  const { data: statusData } = useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected

  const { data: completedData, isPending: completedPending } =
    useMeetingsCompletedQuery({ enabled: connected === true })

  const past =
    completedData?.success === true ? completedData.data.meetings : []
  const hasReadyCalls = past.some((m) => m.uiPhase === 'ready')

  const disabledReason = completedPending
    ? 'Ask Fathom is available after calls load.'
    : hasReadyCalls
      ? undefined
      : 'Ask Fathom is available after at least one call is processed.'

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
            title={disabledReason ?? 'Ask Fathom AI'}
            className="border-primary-foreground/20 h-11 cursor-pointer gap-2 rounded-full border px-4.5 py-2.5 text-sm font-semibold tracking-wide shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95"
          >
            <span>Ask AI</span>
          </Button>
        }
      />
    </div>
  )
}

export { FloatingAskFathom }
