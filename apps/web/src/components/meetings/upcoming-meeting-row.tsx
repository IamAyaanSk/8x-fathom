import { usePostMeetingCaptureMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button, buttonVariants } from '@repo/ui-web/components/button'
import { Tooltip } from '@repo/ui-web/components/tooltip'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'
import { CircleDot, ExternalLink, Loader2, Radio } from 'lucide-react'

import { useIsDemoUser } from '#hooks/use-is-demo'
import { useNow } from '#hooks/use-now'
import {
  formatMeetingTimeRange,
  getUpcomingMeetingStatus
} from '#lib/format-meeting-time'
import { getUpcomingMeetingCaptureUi } from '#lib/upcoming-meeting-capture'

type UpcomingMeetingRowProps = {
  meeting: MeetingListItem
}

function UpcomingMeetingRow({ meeting }: UpcomingMeetingRowProps) {
  const isDemo = useIsDemoUser()
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
  const canCapture = capture.canCapture && !isDemo
  const tooltipContent = isDemo
    ? 'Recording bots are unavailable for the demo account. Sign in with Google for complete access.'
    : capture.tooltip
  const timeRange = formatMeetingTimeRange(meeting.startTime, meeting.endTime)
  const statusLabel = getUpcomingMeetingStatus(meeting, now)
  const failedJoin = meeting.uiPhase === 'failed_to_join'
  const isLiveCall =
    meeting.uiPhase === 'in_call_recording' ||
    meeting.baasStatus === 'in_call_recording'
  const actionError =
    captureMutation.isError && captureMutation.variables === meeting.id

  return (
    <li className="hover:bg-muted/30 flex flex-wrap items-center justify-between gap-4 px-6 py-4.5 transition-colors sm:px-7">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-base leading-snug font-semibold">
          {title}
        </p>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
          <span>{timeRange}</span>
          <span>·</span>
          {isLiveCall ? (
            <span className="bg-destructive inline-block size-1.5 animate-pulse rounded-full" />
          ) : null}
          <span className="text-xs">{statusLabel}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {isLiveCall ? (
          <Link
            to="/meetings/$meetingId"
            params={{ meetingId: meeting.id }}
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'gap-1.5 rounded-full px-4 text-xs font-medium shadow-xs'
            )}
          >
            <Radio className="text-destructive size-3.5 animate-pulse" />
            <span>View live call</span>
          </Link>
        ) : (
          <Tooltip content={tooltipContent}>
            <span className="inline-flex">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5 rounded-full px-4 text-xs font-medium shadow-xs"
                disabled={!canCapture}
                aria-label={capture.ariaLabel}
                onClick={() => {
                  captureMutation.mutate(meeting.id)
                }}
              >
                {isCapturing ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : failedJoin ? null : (
                  <CircleDot className="size-3.5" aria-hidden />
                )}
                {failedJoin
                  ? 'Retry recording'
                  : isCapturing
                    ? 'Starting recording…'
                    : 'Start recording'}
              </Button>
            </span>
          </Tooltip>
        )}

        <a
          href={meeting.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'link', size: 'sm' }),
            'gap-1 text-xs'
          )}
        >
          <ExternalLink className="size-3.5" />
          <span>Open meet</span>
        </a>
      </div>
      {actionError ? (
        <p className="text-destructive w-full text-xs">
          {failedJoin
            ? 'Could not send a new bot. Try again.'
            : 'Could not start capture. Try again.'}
        </p>
      ) : null}
    </li>
  )
}

export { UpcomingMeetingRow }
