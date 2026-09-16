import { usePutMeetingScratchpadEntryMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Textarea } from '@repo/ui-web/components/textarea'
import { StickyNote } from 'lucide-react'
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
  const [noteTimestampSec, setNoteTimestampSec] = useState(elapsedSec)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTextRef = useRef('')
  const isDirtyRef = useRef(false)
  const boundTimestampSecRef = useRef(elapsedSec)

  function _entryTextAt(timestampSec: number): string {
    return (
      meeting.scratchpadEntries.find(
        (entry) => entry.timestampSec === timestampSec
      )?.text ?? ''
    )
  }

  useEffect(() => {
    if (isDirtyRef.current || debounceRef.current) {
      return
    }
    if (boundTimestampSecRef.current === elapsedSec) {
      return
    }
    boundTimestampSecRef.current = elapsedSec
    setNoteTimestampSec(elapsedSec)
    const nextDraft = _entryTextAt(elapsedSec)
    draftTextRef.current = nextDraft
    setDraft(nextDraft)
  }, [elapsedSec, meeting.scratchpadEntries])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function scheduleSave(timestampSec: number) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      const trimmed = draftTextRef.current.trim()
      if (trimmed.length === 0) {
        isDirtyRef.current = false
        return
      }
      boundTimestampSecRef.current = timestampSec
      saveMutation.mutate(
        {
          meetingId,
          body: { timestampSec, text: trimmed }
        },
        {
          onSuccess: () => {
            isDirtyRef.current = false
          },
          onError: () => {
            isDirtyRef.current = true
          }
        }
      )
    }, SCRATCHPAD_DEBOUNCE_MS)
  }

  const sortedEntries = [...meeting.scratchpadEntries].sort(
    (left, right) => right.timestampSec - left.timestampSec
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card ring-border flex flex-col gap-3 rounded-xl p-4 ring-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StickyNote aria-hidden className="text-primary size-4" />
            <p className="text-foreground text-sm font-medium">Scratchpad</p>
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatPlaybackTimestamp(noteTimestampSec)}
          </p>
        </div>
        <Textarea
          value={draft}
          placeholder="Jot a note at the current moment…"
          rows={5}
          className="bg-background min-h-[8rem] resize-none"
          onChange={(event) => {
            const next = event.target.value
            isDirtyRef.current = true
            boundTimestampSecRef.current = elapsedSec
            setNoteTimestampSec(elapsedSec)
            draftTextRef.current = next
            setDraft(next)
            scheduleSave(elapsedSec)
          }}
        />
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
