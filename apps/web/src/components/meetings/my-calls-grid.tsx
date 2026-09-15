import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { getMeetingBotUiLabel } from '@repo/api-contract/baas-bot-status'

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
  return trimmed.length > 0 ? trimmed : 'Unknown'
}

function _hasRecordingThumbnail(meeting: MeetingListItem): boolean {
  return (
    meeting.uiPhase !== 'failed_to_join' &&
    meeting.uiPhase !== 'failed_processing'
  )
}

function MyCallCard({ meeting }: { meeting: MeetingListItem }) {
  const title = _meetingTitle(meeting)
  const duration = formatMeetingDurationLabel(
    meeting.startTime,
    meeting.endTime
  )
  const weekday = formatMeetingCardWeekday(meeting.startTime)
  const showRecording = _hasRecordingThumbnail(meeting)
  const statusLabel = getMeetingBotUiLabel(meeting.uiPhase, meeting.baasStatus)

  return (
    <article className="flex flex-col gap-3">
      <div
        className={
          showRecording
            ? 'from-chart-4/45 via-chart-4/25 to-muted relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br'
            : 'bg-muted/60 ring-border relative flex aspect-video items-center justify-center overflow-hidden rounded-xl ring-1'
        }
      >
        {!showRecording ? (
          <p className="text-destructive text-xs font-semibold tracking-wide uppercase">
            No audio
          </p>
        ) : null}
        <span className="bg-background/70 text-foreground absolute right-2 bottom-2 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums backdrop-blur-sm">
          {duration}
        </span>
      </div>
      <div className="min-w-0 px-0.5">
        <p className="text-foreground truncate text-base font-semibold">
          {title}
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm">{statusLabel}</p>
        <p className="text-muted-foreground/80 mt-0.5 text-sm">{weekday}</p>
      </div>
    </article>
  )
}

function MyCallsGrid({ meetings, nowMs }: MyCallsGridProps) {
  if (meetings.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-foreground text-sm font-medium">No past calls yet</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Recorded and processing calls appear here after the scheduled end
          time.
        </p>
      </div>
    )
  }

  const groups = groupMeetingsByDay(meetings, nowMs)

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-4">
          <h3 className="text-foreground text-base font-semibold">
            {group.label}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {group.meetings.map((meeting) => (
              <MyCallCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export { MyCallsGrid }
