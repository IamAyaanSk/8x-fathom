import type { MeetingShareDetail } from '@repo/api-client/v1/share/index'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'

import { MeetingSummaryPanel } from '#components/meetings/meeting-summary-panel'
import { MeetingTranscriptPanel } from '#components/meetings/meeting-transcript-panel'

type MeetingShareRecordingTabsProps = {
  meeting: MeetingShareDetail
  shareSlug: string
  currentTimeSec: number
  onSeek: (timestampSec: number) => void
}

function MeetingShareRecordingTabs({
  meeting,
  shareSlug,
  currentTimeSec,
  onSeek
}: MeetingShareRecordingTabsProps) {
  return (
    <Tabs defaultValue="summary" className="gap-0">
      <div className="border-border border-b">
        <TabsList
          variant="line"
          className="h-11 w-full justify-start gap-6 rounded-none bg-transparent p-0"
        >
          <TabsTrigger
            value="summary"
            className="text-muted-foreground data-active:text-foreground h-11 rounded-none px-0 text-[11px] font-semibold tracking-[0.12em] uppercase"
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="text-muted-foreground data-active:text-foreground h-11 rounded-none px-0 text-[11px] font-semibold tracking-[0.12em] uppercase"
          >
            Transcript
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="summary" className="pt-6">
        <MeetingSummaryPanel
          meeting={meeting}
          onSeek={onSeek}
          canRecreateSummary={false}
          readOnly
        />
      </TabsContent>
      <TabsContent value="transcript" className="pt-6">
        <MeetingTranscriptPanel
          shareSlug={shareSlug}
          currentTimeSec={currentTimeSec}
          onSeek={onSeek}
        />
      </TabsContent>
    </Tabs>
  )
}

export { MeetingShareRecordingTabs }
