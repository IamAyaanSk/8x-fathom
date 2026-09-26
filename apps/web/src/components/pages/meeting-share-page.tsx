import { useMeetingShareDetailQuery } from '@repo/api-client/v1/share/hooks'
import { Button } from '@repo/ui-web/components/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'
import { Link } from '@tanstack/react-router'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { MeetingShareSidebar } from '#components/meetings/meeting-share-sidebar'
import { MeetingSummaryPanel } from '#components/meetings/meeting-summary-panel'
import { MeetingTranscriptPanel } from '#components/meetings/meeting-transcript-panel'
import { MeetingVideoPlayer } from '#components/meetings/meeting-video-player'
import { formatMeetingDetailDate } from '#lib/format-meeting-detail-date'

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
        <p className="text-muted-foreground text-sm">Loading call…</p>
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
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  const meeting = data.data
  const title =
    meeting.title.trim().length > 0 ? meeting.title : 'Untitled call'
  const dateLabel = formatMeetingDetailDate(meeting.startTime)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1 pb-1">
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

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-6">
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
              <MeetingSummaryPanel
                meeting={meeting}
                canRecreateSummary={false}
                readOnly
                onSeek={handleSeek}
              />
            </TabsContent>

            <TabsContent value="transcript" className="mt-6">
              <MeetingTranscriptPanel
                shareSlug={shareSlug}
                currentTimeSec={currentTimeSec}
                onSeek={handleSeek}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <MeetingVideoPlayer
            meeting={meeting}
            onSeekReady={handleSeekReady}
            onTimeUpdate={setCurrentTimeSec}
          />

          <MeetingShareSidebar meeting={meeting} onSeek={handleSeek} />
        </div>
      </div>

      <footer className="border-border/40 mt-16 flex flex-col items-center justify-center gap-2 border-t pt-8 pb-12 text-center text-xs">
        <p className="text-muted-foreground">
          This call was recorded and summarized using{' '}
          <Link
            to="/"
            className="text-foreground hover:text-primary font-medium underline underline-offset-4 transition-colors"
          >
            8x-fathom
          </Link>
          .
        </p>
      </footer>
    </div>
  )
}

export { MeetingSharePage }
