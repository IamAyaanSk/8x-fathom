import { useMeetingTranscriptQuery } from '@repo/api-client/v1/meetings/hooks'
import { useMeetingShareTranscriptQuery } from '@repo/api-client/v1/share/hooks'
import type { MeetingTranscriptLine } from '@repo/shared-validations/meeting'
import { cn } from '@repo/ui-web/lib/utils'
import { Clock, Loader2, MessageSquare, Search } from 'lucide-react'
import { useState } from 'react'

import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'

type MeetingTranscriptPanelProps = {
  meetingId?: string
  shareSlug?: string
  currentTimeSec: number
  onSeek: (timestampSec: number) => void
}

const EMPTY_LINES: MeetingTranscriptLine[] = []

function MeetingTranscriptPanel({
  meetingId,
  shareSlug,
  currentTimeSec,
  onSeek
}: MeetingTranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const meetingTranscript = useMeetingTranscriptQuery(meetingId ?? '', {
    enabled: meetingId != null && meetingId.length > 0
  })
  const shareTranscript = useMeetingShareTranscriptQuery(shareSlug ?? '', {
    enabled: shareSlug != null && shareSlug.length > 0
  })

  const query = shareSlug ? shareTranscript : meetingTranscript
  const { data, isPending, isError, refetch } = query

  const lines = data?.success === true ? data.data.lines : EMPTY_LINES

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const filteredLines = trimmedQuery
    ? lines.filter(
        (line) =>
          line.text.toLowerCase().includes(trimmedQuery) ||
          (line.speaker && line.speaker.toLowerCase().includes(trimmedQuery))
      )
    : lines

  const groupedDialogues: {
    speaker: string
    startSec: number
    lines: MeetingTranscriptLine[]
  }[] = []

  for (const line of filteredLines) {
    const speaker = line.speaker?.trim() || 'Speaker'
    const lastGroup = groupedDialogues[groupedDialogues.length - 1]

    if (lastGroup && lastGroup.speaker === speaker) {
      lastGroup.lines.push(line)
    } else {
      groupedDialogues.push({
        speaker,
        startSec: line.startSec,
        lines: [line]
      })
    }
  }

  if (isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2.5 py-12 text-center text-sm">
        <Loader2 aria-hidden className="text-primary size-4 animate-spin" />
        <span>Loading transcript…</span>
      </div>
    )
  }

  if (isError || data?.success !== true) {
    return (
      <div className="flex flex-col items-start gap-2 py-8">
        <p className="text-destructive text-sm font-medium">
          Could not load transcript.
        </p>
        <button
          type="button"
          className="text-primary text-xs font-semibold hover:underline"
          onClick={() => {
            void refetch()
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
        <MessageSquare className="size-8 opacity-40" />
        <p className="text-sm">No transcript available for this call.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Transcript Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Clock className="size-3.5" />
          <span>Click any line or timestamp to jump in the recording</span>
        </div>

        {lines.length > 5 ? (
          <div className="relative w-full sm:w-60">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcript…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary h-8 w-full rounded-lg border pr-3 pl-8 text-xs outline-none focus:ring-1"
            />
          </div>
        ) : null}
      </div>

      {/* Clean Flowing Transcript List (No boxed cards) */}
      <div className="flex flex-col gap-6">
        {groupedDialogues.map((group, groupIdx) => {
          const initials = group.speaker.slice(0, 2).toUpperCase()

          return (
            <div
              key={`${group.speaker}-${group.startSec}-${groupIdx}`}
              className="flex items-start gap-3.5"
            >
              {/* Speaker Avatar / Initials */}
              <div
                className="bg-secondary text-secondary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wider select-none"
                aria-hidden
              >
                {initials}
              </div>

              {/* Speaker Dialogue Block */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground text-xs font-semibold">
                    {group.speaker}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSeek(group.startSec)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded px-1 font-mono text-[11px] tabular-nums transition-colors"
                    title={`Jump to ${formatPlaybackTimestamp(group.startSec)}`}
                  >
                    {formatPlaybackTimestamp(group.startSec)}
                  </button>
                </div>

                <div className="flex flex-col gap-1 text-sm leading-relaxed">
                  {group.lines.map((line, lineIdx) => {
                    const isActive =
                      currentTimeSec >= line.startSec &&
                      currentTimeSec < (line.endSec ?? line.startSec + 2)

                    return (
                      <p
                        key={`${line.startSec}-${lineIdx}`}
                        onClick={() => onSeek(line.startSec)}
                        className={cn(
                          'cursor-pointer rounded-md px-1.5 py-0.5 transition-colors',
                          isActive
                            ? 'bg-primary/10 text-foreground font-medium'
                            : 'text-foreground/85 hover:bg-muted/40 hover:text-foreground'
                        )}
                      >
                        {line.text}
                      </p>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {filteredLines.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            No matching phrases found for "{searchQuery}".
          </p>
        ) : null}
      </div>
    </div>
  )
}

export { MeetingTranscriptPanel }
