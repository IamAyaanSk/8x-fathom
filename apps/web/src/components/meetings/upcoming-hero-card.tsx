import { usePostMeetingCaptureMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button, buttonVariants } from '@repo/ui-web/components/button'
import { Tooltip } from '@repo/ui-web/components/tooltip'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'
import { CircleDot, Clock, ExternalLink, Loader2, Radio } from 'lucide-react'

import { useIsDemoUser } from '#hooks/use-is-demo'
import {
  formatMeetingStartingIn,
  formatMeetingTimeRange
} from '#lib/format-meeting-time'
import {
  formatMeetingDurationLabel,
  getMeetingDayGroupLabel
} from '#lib/meeting-day-groups'
import { getUpcomingMeetingCaptureUi } from '#lib/upcoming-meeting-capture'

type UpcomingHeroCardProps = {
  meeting: MeetingListItem
  nowMs: number
}

function UpcomingHeroCard({ meeting, nowMs }: UpcomingHeroCardProps) {
  const isDemo = useIsDemoUser()
  const captureMutation = usePostMeetingCaptureMutation()
  const title =
    meeting.title.trim().length > 0 ? meeting.title.trim() : 'Untitled meeting'
  const isCapturing =
    captureMutation.isPending && captureMutation.variables === meeting.id
  const capture = getUpcomingMeetingCaptureUi({
    meeting,
    nowMs,
    isCapturing
  })
  const timeRange = formatMeetingTimeRange(meeting.startTime, meeting.endTime)
  const durationLabel = formatMeetingDurationLabel(
    meeting.startTime,
    meeting.endTime
  )
  const dayLabel = getMeetingDayGroupLabel(meeting.startTime, nowMs)
  const startingIn = formatMeetingStartingIn(
    meeting.startTime,
    meeting.endTime,
    nowMs,
    meeting.uiPhase,
    meeting.baasStatus
  )
  const isLiveCall = meeting.uiPhase === 'in_call_recording'
  const failedJoin = meeting.uiPhase === 'failed_to_join'
  const canCapture = capture.canCapture && !isDemo
  const captureTooltip = isDemo
    ? 'Recording bots are unavailable for the demo account. Sign in with Google for complete access.'
    : capture.tooltip
  const actionError =
    captureMutation.isError && captureMutation.variables === meeting.id

  return (
    <div className="bg-card border-border/70 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl border p-6 shadow-xs sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="text-primary text-xs font-semibold tracking-wider uppercase">
          Next Meeting
        </span>
        {startingIn ? (
          <span className="text-muted-foreground text-xs font-medium">
            {startingIn}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground line-clamp-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
          <div className="text-foreground flex items-center gap-1.5 font-medium">
            <Clock className="text-muted-foreground size-4 shrink-0" />
            <span>{timeRange}</span>
          </div>
          <span className="text-muted-foreground/40">·</span>
          <span>{dayLabel}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{durationLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
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
            <Tooltip content={captureTooltip}>
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

          {meeting.meetingUrl ? (
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'border-border/80 text-foreground hover:bg-muted/50 gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-2xs transition-colors'
              )}
            >
              <ExternalLink className="text-muted-foreground size-3.5" />
              <span>Open meet</span>
            </a>
          ) : null}
        </div>

        {actionError ? (
          <p className="text-destructive text-xs">
            {failedJoin
              ? 'Could not send a new bot. Try again.'
              : 'Could not start capture. Try again.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export { UpcomingHeroCard }
