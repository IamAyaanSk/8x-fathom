import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { getMeetingBotUiLabel } from '@repo/shared-utils/meeting'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@repo/ui-web/components/empty'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'
import { Loader2, Play, Video, VideoOff } from 'lucide-react'

import { formatMeetingTimeRange } from '#lib/format-meeting-time'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import {
  formatMeetingCardWeekday,
  formatMeetingDurationLabel,
  groupMeetingsByDay
} from '#lib/meeting-day-groups'

type MyCallsGridProps = {
  meetings: MeetingListItem[]
  nowMs: number
}

function _meetingTitle(meeting: MeetingListItem): string {
  const trimmed = meeting.title.trim()
  return trimmed.length > 0 ? trimmed : 'Untitled call'
}

function _hasRecordingThumbnail(meeting: MeetingListItem): boolean {
  return (
    meeting.uiPhase !== 'failed_to_join' &&
    meeting.uiPhase !== 'failed_processing' &&
    meeting.baasStatus !== 'failed'
  )
}

const CARD_GRADIENTS = [
  'from-primary/20 via-muted/60 to-accent/20',
  'from-accent/25 via-muted/70 to-chart-3/20',
  'from-chart-1/20 via-chart-2/15 to-muted/80',
  'from-chart-2/20 via-muted/60 to-primary/20',
  'from-chart-3/20 via-accent/15 to-muted/80',
  'from-chart-5/25 via-chart-4/15 to-muted/70'
] as const

function _getMeetingGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % CARD_GRADIENTS.length
  return CARD_GRADIENTS[index]!
}

function MyCallCard({ meeting }: { meeting: MeetingListItem }) {
  const title = _meetingTitle(meeting)
  const duration =
    meeting.recordingDurationSec != null && meeting.recordingDurationSec > 0
      ? formatPlaybackTimestamp(meeting.recordingDurationSec)
      : formatMeetingDurationLabel(meeting.startTime, meeting.endTime)
  const weekday = formatMeetingCardWeekday(meeting.startTime)
  const timeRange = formatMeetingTimeRange(meeting.startTime, meeting.endTime)
  const showRecording = _hasRecordingThumbnail(meeting)
  const isFailed =
    meeting.uiPhase === 'failed_to_join' ||
    meeting.uiPhase === 'failed_processing' ||
    meeting.baasStatus === 'failed'
  const isProcessing =
    meeting.uiPhase === 'transcribing' ||
    meeting.uiPhase === 'call_ended_processing'
  const statusLabel = getMeetingBotUiLabel(meeting.uiPhase, meeting.baasStatus)
  const displayStatus = isFailed ? 'Processing failed' : statusLabel

  return (
    <Link
      to="/meetings/$meetingId"
      params={{ meetingId: meeting.id }}
      className="group focus-visible:ring-ring flex flex-col gap-2.5 rounded-xl transition-transform duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2"
    >
      <div
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl',
          showRecording
            ? cn('bg-linear-to-br', _getMeetingGradient(meeting.id))
            : 'bg-muted/60 flex items-center justify-center'
        )}
      >
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 text-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-xs backdrop-blur-xs">
              <Loader2 className="text-primary size-3 animate-spin" />
              <span>Processing…</span>
            </div>
          </div>
        ) : showRecording ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 text-foreground flex size-9 items-center justify-center rounded-full shadow-md backdrop-blur-xs transition-transform duration-200 group-hover:scale-110">
              <Play className="fill-foreground ml-0.5 size-3.5" />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <VideoOff className="text-destructive/80 size-3.5" />
            <span>No recording</span>
          </div>
        )}

        {showRecording && !isProcessing ? (
          <span className="bg-background/85 text-foreground absolute right-2 bottom-2 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums shadow-2xs backdrop-blur-sm">
            {duration}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 px-0.5">
        <p className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors sm:text-base">
          {title}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {displayStatus !== 'Ready' ? (
            <span
              className={cn(
                'font-medium',
                isFailed ? 'text-destructive' : 'text-primary'
              )}
            >
              {displayStatus} ·{' '}
            </span>
          ) : null}
          <span>{weekday}</span>
          <span> · </span>
          <span>{timeRange}</span>
        </p>
      </div>
    </Link>
  )
}

function MyCallsGrid({ meetings, nowMs }: MyCallsGridProps) {
  if (meetings.length === 0) {
    return (
      <div className="w-full py-8">
        <Empty className="bg-muted/40 min-h-[500px] w-full border-0 p-12 md:min-h-[580px] md:p-20">
          <EmptyHeader className="max-w-lg">
            <EmptyMedia variant="icon">
              <Video className="text-muted-foreground size-6" />
            </EmptyMedia>
            <EmptyTitle className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              No past calls yet
            </EmptyTitle>
            <EmptyDescription className="text-muted-foreground text-sm leading-relaxed">
              Recorded and processing calls appear here after the scheduled end
              time.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const groups = groupMeetingsByDay(meetings, nowMs)

  return (
    <div className="flex flex-col gap-6">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <span className="bg-primary size-2 rounded-full" />
        <span>Recorded Calls ({meetings.length})</span>
      </div>

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.label} className="flex flex-col gap-3.5">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">
              {group.label}
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.meetings.map((meeting) => (
                <MyCallCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export { MyCallsGrid }
