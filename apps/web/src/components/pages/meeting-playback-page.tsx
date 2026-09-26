import { useMeetingDetailQuery } from '@repo/api-client/v1/meetings/hooks'
import { usePostMeetingShareEnableMutation } from '@repo/api-client/v1/share/hooks'
import { getMeetingBotUiLabel } from '@repo/shared-utils/meeting'
import { Button } from '@repo/ui-web/components/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Share2,
  Sparkles
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { MeetingAskFathomPanel } from '#components/meetings/meeting-ask-fathom-panel'
import { MeetingDetailSidebar } from '#components/meetings/meeting-detail-sidebar'
import { MeetingLivePage } from '#components/meetings/meeting-live-page'
import { MeetingSummaryPanel } from '#components/meetings/meeting-summary-panel'
import { MeetingTranscriptPanel } from '#components/meetings/meeting-transcript-panel'
import { MeetingVideoPlayer } from '#components/meetings/meeting-video-player'
import { useIsDemoUser } from '#hooks/use-is-demo'
import { useNow } from '#hooks/use-now'
import { formatMeetingDetailDate } from '#lib/format-meeting-detail-date'
import { getRecordingElapsedSec } from '#lib/recording-elapsed-sec'

type MeetingPlaybackPageProps = {
  meetingId: string
}

function MeetingPlaybackPage({ meetingId }: MeetingPlaybackPageProps) {
  const isDemo = useIsDemoUser()
  const { data, isPending, isError, refetch } = useMeetingDetailQuery(meetingId)
  const enableShare = usePostMeetingShareEnableMutation()
  const nowMs = useNow(1000)
  const [currentTimeSec, setCurrentTimeSec] = useState(0)
  const [copiedShare, setCopiedShare] = useState(false)
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
            to="/meetings/my-calls"
            className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Back to library
          </Link>
        </div>
      </div>
    )
  }

  const meeting = data.data
  const title =
    meeting.title.trim().length > 0 ? meeting.title : 'Untitled call'
  const dateLabel = formatMeetingDetailDate(meeting.startTime)
  const isLiveRecording = meeting.uiPhase === 'in_call_recording'
  const statusLabel = getMeetingBotUiLabel(meeting.uiPhase, meeting.baasStatus)
  const liveElapsedSec = getRecordingElapsedSec(
    meeting.recordingStartedAt,
    nowMs
  )
  const canShare = meeting.processingStatus === 'ready'
  const isFailed =
    meeting.uiPhase === 'failed_to_join' ||
    meeting.uiPhase === 'failed_processing' ||
    meeting.baasStatus === 'failed' ||
    meeting.processingStatus === 'failed'

  async function handleShare() {
    if (!canShare) {
      return
    }

    try {
      let shareSlug = meeting.shareSlug
      if (!shareSlug) {
        const result = await enableShare.mutateAsync(meetingId)
        if (result.success !== true) {
          return
        }
        shareSlug = result.data.shareSlug
      }

      const shareUrl = `${window.location.origin}/share/${shareSlug}`
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      window.setTimeout(() => {
        setCopiedShare(false)
      }, 2000)
    } catch {
      return
    }
  }

  if (isLiveRecording) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/meetings/live"
          className="text-muted-foreground hover:text-foreground mb-8 -ml-1 inline-flex w-fit items-center gap-2 text-sm transition-colors sm:-ml-5"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to Live Calls
        </Link>
        <div className="sm:pl-2">
          <MeetingLivePage
            meeting={meeting}
            meetingId={meetingId}
            statusLabel={statusLabel}
            liveElapsedSec={liveElapsedSec}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="border-border/50 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Link
            to="/meetings/my-calls"
            className="text-muted-foreground hover:text-foreground -ml-1.5 inline-flex w-fit items-center gap-1.5 text-xs transition-colors sm:-ml-4"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            <span>Back to My Calls</span>
          </Link>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h1>
            <span className="text-muted-foreground text-xs select-none">·</span>
            <span className="text-muted-foreground text-xs font-medium">
              {dateLabel}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5 rounded-full px-4 text-xs font-medium shadow-xs"
            disabled={!canShare || enableShare.isPending}
            onClick={() => {
              void handleShare()
            }}
          >
            {copiedShare ? (
              <>
                <Check className="size-3.5" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="size-3.5" />
                <span>Share</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {!isFailed ? (
            <Tabs defaultValue="summary" className="w-full">
              <div className="border-border/60 border-b pb-1">
                <TabsList
                  variant="line"
                  className="h-10 w-full justify-start gap-8 bg-transparent p-0"
                >
                  <TabsTrigger
                    value="summary"
                    className="data-active:text-foreground text-muted-foreground h-10 gap-1.5 px-0 text-xs font-semibold tracking-wider uppercase"
                  >
                    <Sparkles className="size-3.5" />
                    <span>AI Summary</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="transcript"
                    className="data-active:text-foreground text-muted-foreground h-10 gap-1.5 px-0 text-xs font-semibold tracking-wider uppercase"
                  >
                    <FileText className="size-3.5" />
                    <span>Transcript</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="summary" className="mt-6">
                <div className="flex flex-col gap-10">
                  <MeetingSummaryPanel
                    meeting={meeting}
                    canRecreateSummary={meeting.processingStatus === 'ready'}
                    recreateDisabledReason={
                      isDemo
                        ? 'Recreating summaries is unavailable for the demo account. Sign in with Google for complete access.'
                        : undefined
                    }
                  />

                  <div className="border-border/60 border-t pt-8">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
                        <Sparkles className="size-3.5" />
                      </span>
                      <h3 className="text-foreground text-sm font-semibold tracking-tight">
                        Ask Fathom about this and previous calls
                      </h3>
                    </div>
                    <MeetingAskFathomPanel
                      meetingId={meeting.id}
                      disabledReason={
                        isDemo
                          ? 'Fathom AI is unavailable for the demo account. Sign in with Google for complete access.'
                          : meeting.processingStatus === 'ready'
                            ? undefined
                            : 'Ask Fathom is available after this call is processed.'
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <MeetingTranscriptPanel
                  meetingId={meeting.id}
                  currentTimeSec={currentTimeSec}
                  onSeek={handleSeek}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-10">
              <MeetingSummaryPanel
                meeting={meeting}
                canRecreateSummary={false}
              />

              <div className="border-border/60 border-t pt-8">
                <div className="mb-4 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
                    <Sparkles className="size-3.5" />
                  </span>
                  <h3 className="text-foreground text-sm font-semibold tracking-tight">
                    Ask Fathom about this and previous calls
                  </h3>
                </div>
                <MeetingAskFathomPanel
                  meetingId={meeting.id}
                  disabledReason={
                    isDemo
                      ? 'Fathom AI is unavailable for the demo account. Sign in with Google for complete access.'
                      : 'Ask Fathom is not available because this call could not be processed.'
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          <MeetingVideoPlayer
            meeting={meeting}
            onSeekReady={handleSeekReady}
            onTimeUpdate={setCurrentTimeSec}
          />

          <MeetingDetailSidebar
            meeting={meeting}
            meetingId={meetingId}
            onSeek={handleSeek}
          />
        </div>
      </div>
    </div>
  )
}

export { MeetingPlaybackPage }
