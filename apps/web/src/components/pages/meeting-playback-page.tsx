import { useMeetingDetailQuery } from '@repo/api-client/v1/meetings/hooks'
import { getMeetingBotUiLabel } from '@repo/api-contract/baas-bot-status'
import { Button } from '@repo/ui-web/components/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { MeetingDetailSidebar } from '#components/meetings/meeting-detail-sidebar'
import { MeetingLiveCapturePanel } from '#components/meetings/meeting-live-capture-panel'
import { MeetingRecordingTabs } from '#components/meetings/meeting-recording-tabs'
import { MeetingVideoPlayer } from '#components/meetings/meeting-video-player'
import { useNow } from '#hooks/use-now'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import { getRecordingElapsedSec } from '#lib/recording-elapsed-sec'

const detailTabTriggerClassName = cn(
  'h-9 rounded-lg px-4 text-sm font-medium',
  'data-active:bg-primary data-active:text-primary-foreground'
)

type MeetingPlaybackPageProps = {
  meetingId: string
}

function MeetingPlaybackPage({ meetingId }: MeetingPlaybackPageProps) {
  const { data, isPending, isError, refetch } = useMeetingDetailQuery(meetingId)
  const nowMs = useNow(1000)
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
  const isLiveRecording = meeting.uiPhase === 'in_call_recording'
  const hasRecordingPlayback = meeting.recordingPlayback != null
  const defaultDetailTab = isLiveRecording ? 'ongoing' : 'recording'
  const statusLabel = getMeetingBotUiLabel(meeting.uiPhase, meeting.baasStatus)
  const liveElapsedSec = getRecordingElapsedSec(
    meeting.recordingStartedAt,
    nowMs
  )

  const recordingColumn = hasRecordingPlayback ? (
    <>
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
    </>
  ) : (
    <div className="bg-card ring-border flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl px-6 text-center ring-1">
      <p className="text-foreground text-sm font-medium">{statusLabel}</p>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
        {isLiveRecording
          ? 'Use Highlight and Scratchpad while the bot records. The full recording appears here when processing finishes.'
          : 'Recording is not available yet. Check back when processing finishes.'}
      </p>
    </div>
  )

  const mainColumn =
    isLiveRecording && hasRecordingPlayback ? (
      <Tabs defaultValue={defaultDetailTab} className="flex flex-col gap-6">
        <TabsList className="bg-muted/50 w-fit p-1">
          <TabsTrigger value="ongoing" className={detailTabTriggerClassName}>
            Ongoing
          </TabsTrigger>
          <TabsTrigger value="recording" className={detailTabTriggerClassName}>
            Recording
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ongoing" className="mt-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="bg-card ring-border flex flex-col gap-4 rounded-2xl p-6 ring-1">
              <div>
                <p className="text-foreground text-lg font-semibold">
                  {meeting.title}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {statusLabel}
                  {meeting.recordingStartedAt
                    ? ` · ${formatPlaybackTimestamp(liveElapsedSec)} elapsed`
                    : null}
                </p>
              </div>
              <MeetingLiveCapturePanel
                meeting={meeting}
                meetingId={meetingId}
              />
            </div>
            <div className="hidden min-w-0 flex-col gap-4 lg:flex">
              {recordingColumn}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="recording" className="mt-0 flex flex-col gap-6">
          {recordingColumn}
        </TabsContent>
      </Tabs>
    ) : isLiveRecording ? (
      <div className="flex flex-col gap-6">
        <div className="bg-card ring-border flex flex-col gap-4 rounded-2xl p-6 ring-1">
          <div>
            <p className="text-foreground text-lg font-semibold">
              {meeting.title}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {statusLabel}
              {meeting.recordingStartedAt
                ? ` · ${formatPlaybackTimestamp(liveElapsedSec)} elapsed`
                : null}
            </p>
          </div>
          <MeetingLiveCapturePanel meeting={meeting} meetingId={meetingId} />
        </div>
        {recordingColumn}
      </div>
    ) : (
      <div className="flex flex-col gap-6">{recordingColumn}</div>
    )

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
        <div className="flex min-w-0 flex-col gap-6">{mainColumn}</div>
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
