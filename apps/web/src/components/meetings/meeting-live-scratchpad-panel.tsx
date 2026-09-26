import { usePutMeetingScratchpadEntryMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Textarea } from '@repo/ui-web/components/textarea'
import { Check, Loader2, StickyNote } from 'lucide-react'
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
  const [hasSaved, setHasSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTextRef = useRef('')
  const isDirtyRef = useRef(false)

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function getNextTimestampSec(): number {
    if (elapsedSec > 0) {
      return elapsedSec
    }
    if (meeting.scratchpadEntries.length > 0) {
      return (
        Math.max(...meeting.scratchpadEntries.map((e) => e.timestampSec)) + 1
      )
    }
    return 0
  }

  function handleSave(clearAfter = false) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    const trimmed = draftTextRef.current.trim()
    if (trimmed.length === 0) {
      isDirtyRef.current = false
      return
    }

    const timestampSec = getNextTimestampSec()

    saveMutation.mutate(
      {
        meetingId,
        body: { timestampSec, text: trimmed }
      },
      {
        onSuccess: () => {
          isDirtyRef.current = false
          setHasSaved(true)
          if (clearAfter) {
            draftTextRef.current = ''
            setDraft('')
          }
        },
        onError: () => {
          isDirtyRef.current = true
        }
      }
    )
  }

  function scheduleAutoSave() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      handleSave(false)
    }, SCRATCHPAD_DEBOUNCE_MS)
  }

  const sortedEntries = [...meeting.scratchpadEntries].sort(
    (left, right) => right.timestampSec - left.timestampSec
  )

  const isSaving =
    saveMutation.isPending && saveMutation.variables?.meetingId === meetingId

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          placeholder="Jot a note during the call…"
          rows={4}
          className="min-h-[7rem] resize-none text-sm"
          onChange={(event) => {
            const next = event.target.value
            isDirtyRef.current = true
            setHasSaved(false)
            draftTextRef.current = next
            setDraft(next)
            scheduleAutoSave()
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              handleSave(true)
            }
          }}
        />

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <>
                <Loader2 aria-hidden className="size-3 animate-spin" />
                <span>Saving…</span>
              </>
            ) : hasSaved ? (
              <>
                <Check aria-hidden="true" className="text-primary size-3" />
                <span>Saved</span>
              </>
            ) : null}
          </div>
          <span className="text-muted-foreground/60 text-[11px]">
            Press ⌘↵ to save new note
          </span>
        </div>
      </div>

      {saveMutation.isError ? (
        <p className="text-destructive text-xs">
          Could not save note. Try again.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Saved scratchpad
          </p>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {sortedEntries.length}
          </span>
        </div>

        {sortedEntries.length === 0 ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            No notes saved yet.
          </p>
        ) : (
          <ul className="divide-border/50 flex flex-col divide-y">
            {sortedEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-0.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <StickyNote
                    aria-hidden
                    className="text-muted-foreground size-3 shrink-0"
                  />
                  {entry.timestampSec > 0 ? (
                    <span className="text-primary font-medium tabular-nums">
                      {formatPlaybackTimestamp(entry.timestampSec)}
                    </span>
                  ) : null}
                </div>
                <p className="text-foreground/90 pl-4.5 leading-relaxed whitespace-pre-wrap">
                  {entry.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export { MeetingLiveScratchpadPanel }
