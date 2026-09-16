import { useMeetingShareDetailQuery } from '@repo/api-client/v1/share/hooks'
import { Button } from '@repo/ui-web/components/button'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { MeetingShareRecordingTabs } from '#components/meetings/meeting-share-recording-tabs'
import { MeetingShareSidebar } from '#components/meetings/meeting-share-sidebar'
import { MeetingVideoPlayer } from '#components/meetings/meeting-video-player'

type MeetingSharePageProps = {
  shareSlug: string
}

function MeetingSharePage({ shareSlug }: MeetingSharePageProps) {
  const { data, isPending, isError, refetch } =
    useMeetingShareDetailQuery(shareSlug)
  const [currentTimeSec, setCurrentTimeSec] = useState(0)
  const seekToRef = useRef<(timestampSec: number) => void>(() => undefined)

  const handleSeekReady = useCallback(
    (seekTo: (timestampSec: number) => void) => {
      seekToRef.current = seekTo
    },
    []
  )

  const handleSeek = useCallback((timestampSec: number) => {
    seekToRef.current(timestampSec)
    setCurrentTimeSec(timestampSec)
  }, [])

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-16">
        <Loader2
          aria-hidden
          className="text-muted-foreground size-8 animate-spin"
        />
        <p className="text-muted-foreground text-sm">Loading shared call…</p>
      </div>
    )
  }

  if (isError || data?.success !== true) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-foreground text-sm font-medium">
          This shared call is unavailable.
        </p>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          The link may be incorrect, or the recording is no longer shared.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refetch()
            }}
          >
            Try again
          </Button>
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const meeting = data.data
  const hasRecordingPlayback = meeting.recordingPlayback != null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-muted-foreground mb-6 text-sm">Shared recording</p>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {hasRecordingPlayback ? (
            <MeetingVideoPlayer
              meeting={meeting}
              onSeekReady={handleSeekReady}
              onTimeUpdate={setCurrentTimeSec}
            />
          ) : (
            <div className="bg-card ring-border flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl px-6 text-center ring-1">
              <p className="text-foreground text-sm font-medium">
                Recording is not available
              </p>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                Summary, transcript, and action items are still available below.
              </p>
            </div>
          )}
          <MeetingShareRecordingTabs
            meeting={meeting}
            shareSlug={shareSlug}
            currentTimeSec={currentTimeSec}
            onSeek={handleSeek}
          />
        </div>
        <MeetingShareSidebar
          meeting={meeting}
          onSeek={handleSeek}
          className="lg:sticky lg:top-6"
        />
      </div>
    </div>
  )
}

export { MeetingSharePage }
