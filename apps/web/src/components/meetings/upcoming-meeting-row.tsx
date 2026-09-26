import { usePostMeetingCaptureMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { getMeetingBotUiLabel } from '@repo/shared-utils/meeting'
import { Button, buttonVariants } from '@repo/ui-web/components/button'
import { Tooltip } from '@repo/ui-web/components/tooltip'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'
import { CircleDot, Loader2 } from 'lucide-react'

import { useNow } from '#hooks/use-now'
import { formatMeetingStartTime } from '#lib/format-meeting-time'
import { getUpcomingMeetingCaptureUi } from '#lib/upcoming-meeting-capture'

type UpcomingMeetingRowProps = {
  meeting: MeetingListItem
}

function UpcomingMeetingRow({ meeting }: UpcomingMeetingRowProps) {
  const now = useNow()
  const captureMutation = usePostMeetingCaptureMutation()
  const title =
    meeting.title.trim().length > 0 ? meeting.title.trim() : 'Untitled meeting'
  const isCapturing =
    captureMutation.isPending && captureMutation.variables === meeting.id
  const capture = getUpcomingMeetingCaptureUi({
    meeting,
    nowMs: now,
    isCapturing
  })
  const statusLabel = getMeetingBotUiLabel(meeting.uiPhase, meeting.baasStatus)
  const failedJoin = meeting.uiPhase === 'failed_to_join'
  const liveCall = meeting.uiPhase === 'in_call_recording'
  const actionError =
    captureMutation.isError && captureMutation.variables === meeting.id

  return (
    <li className="border-border flex flex-wrap items-center justify-between gap-4 border-b py-5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-base leading-snug font-semibold">
          {title}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatMeetingStartTime(meeting.startTime)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {statusLabel}
          {meeting.uiPhase === 'joining' || meeting.baasStatus === 'joining'
            ? ' · May take up to 5 minutes to join'
            : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {liveCall ? (
          <Link
            to="/meetings/$meetingId"
            params={{ meetingId: meeting.id }}
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'rounded-full'
            )}
          >
            Live call
          </Link>
        ) : null}
        <a
          href={meeting.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm' }),
            'rounded-full'
          )}
        >
          Join
        </a>
        <Tooltip content={capture.tooltip}>
          <span className="inline-flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled={!capture.canCapture}
              aria-label={capture.ariaLabel}
              onClick={() => {
                captureMutation.mutate(meeting.id)
              }}
            >
              {isCapturing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : failedJoin ? null : (
                <CircleDot className="size-4" aria-hidden />
              )}
              {failedJoin ? 'Try again' : 'Capture'}
            </Button>
          </span>
        </Tooltip>
      </div>
      {actionError ? (
        <p className="text-destructive w-full text-sm">
          {failedJoin
            ? 'Could not send a new bot. Try again.'
            : 'Could not start capture. Try again.'}
        </p>
      ) : null}
    </li>
  )
}

export { UpcomingMeetingRow }
