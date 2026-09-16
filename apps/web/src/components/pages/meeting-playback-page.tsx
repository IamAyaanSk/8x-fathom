import { useMeetingDetailQuery } from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { MeetingDetailSidebar } from '#components/meetings/meeting-detail-sidebar'
import { MeetingRecordingTabs } from '#components/meetings/meeting-recording-tabs'
import { MeetingVideoPlayer } from '#components/meetings/meeting-video-player'

type MeetingPlaybackPageProps = {
  meetingId: string
}

function MeetingPlaybackPage({ meetingId }: MeetingPlaybackPageProps) {
  const { data, isPending, isError, refetch } = useMeetingDetailQuery(meetingId)
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
        <p className="text-muted-foreground text-sm">Loading call…</p>
      </div>
    )
  }

  if (isError || data?.success !== true) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-foreground text-sm font-medium">
          Could not load this call.
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
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Back to library
          </Link>
        </div>
      </div>
    )
  }

  const meeting = data.data

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back to My Calls
      </Link>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <MeetingVideoPlayer
            meeting={meeting}
            onSeekReady={handleSeekReady}
            onTimeUpdate={setCurrentTimeSec}
          />
          <MeetingRecordingTabs
            meeting={meeting}
            currentTimeSec={currentTimeSec}
            onSeek={handleSeek}
          />
        </div>
        <MeetingDetailSidebar
          meeting={meeting}
          meetingId={meetingId}
          onSeek={handleSeek}
          className="lg:sticky lg:top-6"
        />
      </div>
    </div>
  )
}

export { MeetingPlaybackPage }
