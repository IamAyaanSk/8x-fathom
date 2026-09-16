import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import {
  usePatchMeetingHighlightMutation,
  usePostMeetingHighlightMutation
} from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'
import { Textarea } from '@repo/ui-web/components/textarea'
import { cn } from '@repo/ui-web/lib/utils'
import { ChevronDown, Loader2, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useNow } from '#hooks/use-now'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import { getRecordingElapsedSec } from '#lib/recording-elapsed-sec'

const HIGHLIGHT_TITLE_DEBOUNCE_MS = 800

type MeetingLiveHighlightPanelProps = {
  meeting: MeetingDetail
  meetingId: string
}

function _activeHighlight(meeting: MeetingDetail) {
  return meeting.highlights.find((highlight) => highlight.endTimestampSec == null)
}

function MeetingLiveHighlightPanel({
  meeting,
  meetingId
}: MeetingLiveHighlightPanelProps) {
  const nowMs = useNow(1000)
  const elapsedSec = getRecordingElapsedSec(meeting.recordingStartedAt, nowMs)
  const activeHighlight = _activeHighlight(meeting)
  const startMutation = usePostMeetingHighlightMutation()
  const endMutation = usePatchMeetingHighlightMutation()
  const [titleDraft, setTitleDraft] = useState('')
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!activeHighlight) {
      setTitleDraft('')
      return
    }
    setTitleDraft(activeHighlight.note ?? '')
  }, [activeHighlight?.id, activeHighlight?.note])

  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current)
      }
    }
  }, [])

  function scheduleTitleSave(nextTitle: string, highlightId: string) {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current)
    }
    titleDebounceRef.current = setTimeout(() => {
      const trimmed = nextTitle.trim()
      endMutation.mutate({
        meetingId,
        highlightId,
        note: trimmed.length > 0 ? trimmed : null
      })
    }, HIGHLIGHT_TITLE_DEBOUNCE_MS)
  }

  const highlightDurationSec = activeHighlight
    ? Math.max(0, elapsedSec - activeHighlight.timestampSec)
    : 0

  const isStarting =
    startMutation.isPending && startMutation.variables?.meetingId === meetingId
  const isEnding =
    endMutation.isPending && endMutation.variables?.meetingId === meetingId

  function handleStartHighlight() {
    startMutation.mutate({
      meetingId,
      body: { timestampSec: elapsedSec }
    })
  }

  function handleEndHighlight() {
    if (!activeHighlight) {
      return
    }
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current)
      titleDebounceRef.current = null
    }
    const trimmedTitle = titleDraft.trim()
    endMutation.mutate({
      meetingId,
      highlightId: activeHighlight.id,
      endTimestampSec: elapsedSec,
      note: trimmedTitle.length > 0 ? trimmedTitle : null
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'ring-border flex overflow-hidden rounded-xl ring-1',
          activeHighlight
            ? 'ring-primary/60 shadow-[0_0_0_1px] shadow-primary/30'
            : 'ring-primary/40 shadow-[0_0_12px] shadow-primary/20'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          className="text-primary h-11 flex-1 justify-start gap-2 rounded-none px-4 font-medium"
          disabled={Boolean(activeHighlight) || isStarting}
          onClick={handleStartHighlight}
        >
          {isStarting ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Video aria-hidden className="size-4" />
          )}
          Highlight
        </Button>
        <span
          aria-hidden
          className="bg-border w-px self-stretch"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary size-11 shrink-0 rounded-none"
          disabled
          aria-hidden
        >
          <ChevronDown className="size-4" />
        </Button>
      </div>

      {activeHighlight ? (
        <div className="bg-card ring-border flex flex-col gap-4 rounded-xl p-4 ring-1">
          <div className="flex items-center gap-2">
            <Video aria-hidden className="text-primary size-4" />
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Highlight — {formatPlaybackTimestamp(highlightDurationSec)}
            </p>
          </div>

          <div
            aria-hidden
            className="flex h-10 items-center justify-center gap-0.5 overflow-hidden rounded-lg bg-muted/50 px-2"
          >
            {Array.from({ length: 32 }, (_, index) => (
              <span
                key={index}
                className="bg-primary/70 w-1 rounded-full"
                style={{
                  height: `${28 + ((index * 7) % 24)}%`,
                  opacity: 0.35 + ((index * 3) % 6) / 10
                }}
              />
            ))}
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={isEnding}
            onClick={handleEndHighlight}
          >
            {isEnding ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : null}
            End Highlight
          </Button>

          <Textarea
            value={titleDraft}
            placeholder="Type to add a title (optional)"
            rows={2}
            className="bg-background min-h-0 resize-none"
            onChange={(event) => {
              const next = event.target.value
              setTitleDraft(next)
              if (activeHighlight) {
                scheduleTitleSave(next, activeHighlight.id)
              }
            }}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Mark an important moment while the call is recording. Highlights appear
          on the recording timeline after the call ends.
        </p>
      )}

      {startMutation.isError || endMutation.isError ? (
        <p className="text-destructive text-sm">
          Could not update highlight. Try again.
        </p>
      ) : null}
    </div>
  )
}

export { MeetingLiveHighlightPanel }
