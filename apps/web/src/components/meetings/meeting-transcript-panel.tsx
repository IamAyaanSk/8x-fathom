import { useMeetingTranscriptQuery } from '@repo/api-client/v1/meetings/hooks'
import { useMeetingShareTranscriptQuery } from '@repo/api-client/v1/share/hooks'
import { Loader2 } from 'lucide-react'

import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'

type MeetingTranscriptPanelProps = {
  meetingId?: string
  shareSlug?: string
  currentTimeSec: number
  onSeek: (timestampSec: number) => void
}

function MeetingTranscriptPanel({
  meetingId,
  shareSlug,
  currentTimeSec,
  onSeek
}: MeetingTranscriptPanelProps) {
  const meetingTranscript = useMeetingTranscriptQuery(meetingId ?? '', {
    enabled: meetingId != null && meetingId.length > 0
  })
  const shareTranscript = useMeetingShareTranscriptQuery(shareSlug ?? '', {
    enabled: shareSlug != null && shareSlug.length > 0
  })

  const query = shareSlug ? shareTranscript : meetingTranscript
  const { data, isPending, isError, refetch } = query

  if (isPending) {
    return (
      <div className="bg-card ring-border flex items-center gap-2 rounded-2xl px-4 py-12 ring-1">
        <Loader2
          aria-hidden
          className="text-muted-foreground size-5 animate-spin"
        />
        <p className="text-muted-foreground text-sm">Loading transcript…</p>
      </div>
    )
  }

  if (isError || data?.success !== true) {
    return (
      <div className="bg-card ring-border rounded-2xl px-4 py-10 ring-1">
        <p className="text-destructive text-sm">Could not load transcript.</p>
        <button
          type="button"
          className="text-primary mt-2 text-sm font-medium hover:underline"
          onClick={() => {
            void refetch()
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  const lines = data.data.lines

  if (lines.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-sm">
        Transcript is empty for this call.
      </p>
    )
  }

  return (
    <div className="bg-card ring-border max-h-[min(32rem,55vh)] overflow-y-auto rounded-2xl ring-1">
      <ul className="divide-border flex flex-col divide-y">
        {lines.map((line, index) => {
          const isActive =
            currentTimeSec >= line.startSec &&
            currentTimeSec < line.endSec + 0.5
          const speaker = line.speaker?.trim()

          return (
            <li key={`${line.startSec}-${index}`}>
              <button
                type="button"
                className={
                  isActive
                    ? 'bg-muted/70 flex w-full gap-4 px-4 py-3 text-left'
                    : 'hover:bg-muted/40 flex w-full gap-4 px-4 py-3 text-left'
                }
                onClick={() => {
                  onSeek(line.startSec)
                }}
              >
                <span className="text-primary w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums">
                  {formatPlaybackTimestamp(line.startSec)}
                </span>
                <span className="min-w-0 flex-1">
                  {speaker ? (
                    <span className="text-foreground mb-0.5 block text-sm font-semibold">
                      {speaker}
                    </span>
                  ) : null}
                  <span className="text-foreground/85 block text-sm leading-relaxed">
                    {line.text}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { MeetingTranscriptPanel }
