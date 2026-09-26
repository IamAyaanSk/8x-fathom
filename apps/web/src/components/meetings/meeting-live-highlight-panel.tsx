import {
  usePatchMeetingHighlightMutation,
  usePostMeetingHighlightMutation
} from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { Textarea } from '@repo/ui-web/components/textarea'
import { cn } from '@repo/ui-web/lib/utils'
import { Loader2, Square, Video } from 'lucide-react'
import { useState } from 'react'

import { useNow } from '#hooks/use-now'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import { getRecordingElapsedSec } from '#lib/recording-elapsed-sec'

type MeetingLiveHighlightPanelProps = {
  meeting: MeetingDetail
  meetingId: string
}

function _activeHighlight(meeting: MeetingDetail) {
  return meeting.highlights.find(
    (highlight) => highlight.endTimestampSec == null
  )
}

function MeetingLiveHighlightPanel({
  meeting,
  meetingId
}: MeetingLiveHighlightPanelProps) {
  const nowMs = useNow(1000)
  const elapsedSec = getRecordingElapsedSec(meeting.recordingStartedAt, nowMs)
  const activeHighlight = _activeHighlight(meeting)
  const startMutation = usePostMeetingHighlightMutation()
  const patchMutation = usePatchMeetingHighlightMutation()
  const [titleDraft, setTitleDraft] = useState('')
  const [highlightStartMs, setHighlightStartMs] = useState<number | null>(null)

  const activeDurationSec = activeHighlight
    ? highlightStartMs
      ? Math.max(1, Math.floor((nowMs - highlightStartMs) / 1000))
      : Math.max(1, elapsedSec - activeHighlight.timestampSec)
    : 0

  const isStarting =
    startMutation.isPending && startMutation.variables?.meetingId === meetingId
  const isEnding =
    patchMutation.isPending &&
    patchMutation.variables?.params.meetingId === meetingId &&
    patchMutation.variables?.body.endTimestampSec !== undefined

  function handleStartHighlight() {
    setTitleDraft('')
    setHighlightStartMs(Date.now())

    startMutation.mutate({
      meetingId,
      body: { timestampSec: Math.max(0, elapsedSec) }
    })
  }

  function handleEndHighlight() {
    if (!activeHighlight) {
      return
    }
    const trimmedTitle = titleDraft.trim()
    const finalDuration = highlightStartMs
      ? Math.max(1, Math.floor((Date.now() - highlightStartMs) / 1000))
      : Math.max(1, activeDurationSec)

    const endTimestampSec = Math.max(
      activeHighlight.timestampSec + finalDuration,
      elapsedSec
    )

    patchMutation.mutate({
      params: {
        meetingId,
        highlightId: activeHighlight.id
      },
      body: {
        endTimestampSec,
        note: trimmedTitle.length > 0 ? trimmedTitle : null
      }
    })
  }

  const savedHighlights = meeting.highlights.filter(
    (h) => h.endTimestampSec != null
  )

  return (
    <div className="flex flex-col gap-5">
      {activeHighlight ? (
        <div className="border-border/80 flex flex-col gap-3 rounded-lg border p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2 shrink-0">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                <span className="bg-primary relative inline-flex size-2 rounded-full" />
              </span>
              <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                Recording highlight
              </span>
            </div>
            <span className="text-primary text-sm font-semibold tabular-nums">
              {formatPlaybackTimestamp(activeDurationSec)}
            </span>
          </div>

          <div
            aria-hidden
            className="flex h-7 items-center justify-start gap-0.5 overflow-hidden"
          >
            {Array.from({ length: 28 }, (_, index) => (
              <span
                key={index}
                className={cn(
                  'bg-primary w-1 rounded-full',
                  index % 3 === 0 &&
                    'animate-[pulse_1.4s_ease-in-out_infinite]',
                  index % 3 === 1 &&
                    'animate-[pulse_1.8s_ease-in-out_0.3s_infinite]',
                  index % 3 === 2 &&
                    'animate-[pulse_1.6s_ease-in-out_0.6s_infinite]'
                )}
                style={{
                  height: `${32 + ((index * 7) % 36)}%`,
                  opacity: 0.4 + ((index * 3) % 5) / 10
                }}
              />
            ))}
          </div>

          <Textarea
            value={titleDraft}
            placeholder="Add a label (optional)"
            rows={2}
            className="min-h-0 resize-none text-xs"
            onChange={(event) => setTitleDraft(event.target.value)}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={isEnding}
            onClick={handleEndHighlight}
          >
            {isEnding ? (
              <Loader2 aria-hidden className="size-3.5 animate-spin" />
            ) : (
              <Square aria-hidden className="size-3 fill-current" />
            )}
            Stop highlight
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="w-full gap-2"
          disabled={isStarting}
          onClick={handleStartHighlight}
        >
          {isStarting ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Video aria-hidden className="size-4" />
          )}
          Start highlight
        </Button>
      )}

      {startMutation.isError || patchMutation.isError ? (
        <p className="text-destructive text-xs">
          Could not update highlight. Try again.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Saved highlights
          </p>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {savedHighlights.length}
          </span>
        </div>

        {savedHighlights.length === 0 ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            No highlights saved yet.
          </p>
        ) : (
          <ul className="divide-border/50 flex flex-col divide-y">
            {savedHighlights.map((h) => {
              const durationSec =
                (h.endTimestampSec ?? h.timestampSec) - h.timestampSec
              const label =
                h.note && h.note.trim().length > 0
                  ? h.note.trim()
                  : `(Unlabelled)`

              return (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 py-1.5 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Video
                      aria-hidden
                      className="text-muted-foreground size-3.5 shrink-0"
                    />
                    <span className="text-foreground/90 truncate font-medium">
                      {label}
                    </span>
                    {h.timestampSec > 0 ? (
                      <span className="text-muted-foreground text-[11px] tabular-nums">
                        ({formatPlaybackTimestamp(h.timestampSec)})
                      </span>
                    ) : null}
                  </div>
                  {durationSec > 0 ? (
                    <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                      {durationSec < 60
                        ? `${durationSec}s`
                        : formatPlaybackTimestamp(durationSec)}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export { MeetingLiveHighlightPanel }
