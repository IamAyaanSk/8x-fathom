import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { cn } from '@repo/ui-web/lib/utils'
import { Sparkles, StickyNote, Video } from 'lucide-react'

import { MeetingTimestampLink } from '#components/meetings/meeting-timestamp-link'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'

type MeetingSummaryCaptureSource = {
  highlights: MeetingDetail['highlights']
  scratchpadEntries?: MeetingDetail['scratchpadEntries']
}

type MeetingSummaryCaptureSectionsProps = {
  meeting: MeetingSummaryCaptureSource
  onSeek: (timestampSec: number) => void
  className?: string
}

function _completedHighlights(meeting: MeetingSummaryCaptureSource) {
  return meeting.highlights
    .filter((highlight) => highlight.endTimestampSec != null)
    .sort((left, right) => left.timestampSec - right.timestampSec)
}

function MeetingSummaryCaptureSections({
  meeting,
  onSeek,
  className
}: MeetingSummaryCaptureSectionsProps) {
  const highlights = _completedHighlights(meeting)
  const scratchpadEntries = [...(meeting.scratchpadEntries ?? [])].sort(
    (left, right) => left.timestampSec - right.timestampSec
  )

  if (highlights.length === 0 && scratchpadEntries.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {highlights.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
            <Video aria-hidden className="text-primary size-4" />
            Highlights
          </h3>
          <ul className="flex flex-col gap-3">
            {highlights.map((highlight) => {
              const endSec = highlight.endTimestampSec ?? highlight.timestampSec
              const rangeLabel =
                endSec > highlight.timestampSec
                  ? `${formatPlaybackTimestamp(highlight.timestampSec)} – ${formatPlaybackTimestamp(endSec)}`
                  : formatPlaybackTimestamp(highlight.timestampSec)
              const label =
                highlight.note?.trim() ||
                `Highlight at ${formatPlaybackTimestamp(highlight.timestampSec)}`

              return (
                <li
                  key={highlight.id}
                  className="bg-muted/30 ring-border flex flex-col gap-1.5 rounded-lg px-3 py-2.5 ring-1"
                >
                  <button
                    type="button"
                    className="text-foreground text-left text-sm font-medium hover:underline"
                    onClick={() => {
                      onSeek(highlight.timestampSec)
                    }}
                  >
                    {label}
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles
                      aria-hidden
                      className="text-chart-4 size-3 shrink-0"
                    />
                    <MeetingTimestampLink
                      timestampSec={highlight.timestampSec}
                      onSeek={onSeek}
                      className="text-primary text-xs font-medium tabular-nums hover:underline"
                    />
                    <span className="text-muted-foreground text-xs tabular-nums">
                      ({rangeLabel})
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {scratchpadEntries.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
            <StickyNote aria-hidden className="text-primary size-4" />
            Scratchpad
          </h3>
          <ul className="flex flex-col gap-3">
            {scratchpadEntries.map((entry) => (
              <li
                key={entry.id}
                className="bg-muted/30 ring-border flex flex-col gap-1.5 rounded-lg px-3 py-2.5 ring-1"
              >
                <MeetingTimestampLink
                  timestampSec={entry.timestampSec}
                  onSeek={onSeek}
                  className="text-primary w-fit text-xs font-medium tabular-nums hover:underline"
                />
                <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export { MeetingSummaryCaptureSections }
