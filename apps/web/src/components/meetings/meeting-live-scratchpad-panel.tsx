import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { usePutMeetingScratchpadEntryMutation } from '@repo/api-client/v1/meetings/hooks'
import { Textarea } from '@repo/ui-web/components/textarea'
import { Loader2, StickyNote } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useNow } from '#hooks/use-now'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import { getRecordingElapsedSec } from '#lib/recording-elapsed-sec'

const SCRATCHPAD_DEBOUNCE_MS = 2_000

type MeetingLiveScratchpadPanelProps = {
  meeting: MeetingDetail
  meetingId: string
}

function MeetingLiveScratchpadPanel({
  meeting,
  meetingId
}: MeetingLiveScratchpadPanelProps) {
  const nowMs = useNow(1000)
  const elapsedSec = getRecordingElapsedSec(meeting.recordingStartedAt, nowMs)
  const saveMutation = usePutMeetingScratchpadEntryMutation()
  const [draft, setDraft] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedTimestampRef = useRef<number | null>(null)
  const pendingTimestampRef = useRef(elapsedSec)

  const entryAtCurrentTime = meeting.scratchpadEntries.find(
    (entry) => entry.timestampSec === elapsedSec
  )

  useEffect(() => {
    if (lastSavedTimestampRef.current === elapsedSec) {
      return
    }
    setDraft(entryAtCurrentTime?.text ?? '')
    lastSavedTimestampRef.current = null
  }, [elapsedSec, entryAtCurrentTime?.text])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function scheduleSave(text: string, timestampSec: number) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    const trimmed = text.trim()
    if (trimmed.length === 0) {
      return
    }
    pendingTimestampRef.current = timestampSec
    debounceRef.current = setTimeout(() => {
      const saveAtSec = pendingTimestampRef.current
      saveMutation.mutate(
        {
          meetingId,
          body: { timestampSec: saveAtSec, text: trimmed }
        },
        {
          onSuccess: () => {
            lastSavedTimestampRef.current = saveAtSec
          }
        }
      )
    }, SCRATCHPAD_DEBOUNCE_MS)
  }

  const sortedEntries = [...meeting.scratchpadEntries].sort(
    (left, right) => right.timestampSec - left.timestampSec
  )

  const isSaving =
    saveMutation.isPending && saveMutation.variables?.meetingId === meetingId

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card ring-border flex flex-col gap-3 rounded-xl p-4 ring-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StickyNote aria-hidden className="text-primary size-4" />
            <p className="text-foreground text-sm font-medium">Scratchpad</p>
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatPlaybackTimestamp(elapsedSec)}
          </p>
        </div>
        <Textarea
          value={draft}
          placeholder="Jot a note at the current moment…"
          rows={5}
          className="bg-background min-h-[8rem] resize-none"
          onChange={(event) => {
            const next = event.target.value
            setDraft(next)
            scheduleSave(next, elapsedSec)
          }}
        />
        {isSaving ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 aria-hidden className="size-3 animate-spin" />
            Saving…
          </p>
        ) : null}
      </div>

      {sortedEntries.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Earlier notes
          </p>
          <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {sortedEntries.map((entry) => (
              <li
                key={entry.id}
                className="bg-muted/40 ring-border rounded-lg px-3 py-2 ring-1"
              >
                <p className="text-primary text-xs font-medium tabular-nums">
                  {formatPlaybackTimestamp(entry.timestampSec)}
                </p>
                <p className="text-foreground mt-1 text-sm whitespace-pre-wrap">
                  {entry.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Notes are saved with the timestamp of the recording when you type.
        </p>
      )}

      {saveMutation.isError ? (
        <p className="text-destructive text-sm">
          Could not save scratchpad note. Try again.
        </p>
      ) : null}
    </div>
  )
}

export { MeetingLiveScratchpadPanel }
