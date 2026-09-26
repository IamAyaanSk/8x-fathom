import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'
import { Info } from 'lucide-react'

import { MeetingLiveHighlightPanel } from '#components/meetings/meeting-live-highlight-panel'
import { MeetingLiveScratchpadPanel } from '#components/meetings/meeting-live-scratchpad-panel'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'

type MeetingLivePageProps = {
  meeting: MeetingDetail
  meetingId: string
  statusLabel: string
  liveElapsedSec: number
}

function MeetingLivePage({
  meeting,
  meetingId,
  statusLabel,
  liveElapsedSec
}: MeetingLivePageProps) {
  const title =
    meeting.title.trim().length > 0 ? meeting.title : 'Untitled call'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2 shrink-0">
            <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-destructive relative inline-flex size-2 rounded-full" />
          </span>
          <span className="text-destructive text-xs font-semibold tracking-wide uppercase">
            Recording
          </span>
        </div>
        <h1 className="text-foreground text-2xl leading-snug font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {statusLabel}
          {liveElapsedSec > 0
            ? ` · ${formatPlaybackTimestamp(liveElapsedSec)} elapsed`
            : null}
        </p>
      </div>

      <div className="border-primary/80 bg-primary/5 text-muted-foreground flex max-w-2xl items-center gap-2.5 rounded-r-lg border-l-2 px-3.5 py-2 text-xs leading-relaxed">
        <Info aria-hidden className="text-primary size-3.5 shrink-0" />
        <p>
          Your bot is recording this call. Use{' '}
          <strong className="text-foreground font-medium">Highlight</strong> to
          bookmark moments, and{' '}
          <strong className="text-foreground font-medium">Scratchpad</strong> to
          jot notes, both are saved and linked to your call recording.
        </p>
      </div>

      <div className="hidden md:grid md:grid-cols-2 md:gap-10">
        <section className="flex flex-col gap-4">
          <SectionLabel label="Highlight" />
          <MeetingLiveHighlightPanel meeting={meeting} meetingId={meetingId} />
        </section>

        <section className="border-border flex flex-col gap-4 border-l pl-10">
          <SectionLabel label="Scratchpad" />
          <MeetingLiveScratchpadPanel meeting={meeting} meetingId={meetingId} />
        </section>
      </div>

      <div className="flex flex-col md:hidden">
        <Tabs defaultValue="highlight" className="w-full">
          <TabsList className="bg-muted/60 grid w-full grid-cols-2 p-1">
            <TabsTrigger
              value="highlight"
              className="data-active:bg-background data-active:text-foreground h-9 rounded-md text-xs font-medium data-active:shadow-sm"
            >
              Highlight
            </TabsTrigger>
            <TabsTrigger
              value="scratchpad"
              className="data-active:bg-background data-active:text-foreground h-9 rounded-md text-xs font-medium data-active:shadow-sm"
            >
              Scratchpad
            </TabsTrigger>
          </TabsList>
          <TabsContent value="highlight" className="mt-5">
            <MeetingLiveHighlightPanel
              meeting={meeting}
              meetingId={meetingId}
            />
          </TabsContent>
          <TabsContent value="scratchpad" className="mt-5">
            <MeetingLiveScratchpadPanel
              meeting={meeting}
              meetingId={meetingId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-foreground text-sm font-semibold">{label}</p>
}

export { MeetingLivePage }
