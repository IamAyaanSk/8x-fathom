import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'

import { MeetingSummaryPanel } from '#components/meetings/meeting-summary-panel'
import { MeetingTranscriptPanel } from '#components/meetings/meeting-transcript-panel'

type MeetingRecordingTabsProps = {
  meeting: MeetingDetail
  currentTimeSec: number
  onSeek: (timestampSec: number) => void
}

function MeetingRecordingTabs({
  meeting,
  currentTimeSec,
  onSeek
}: MeetingRecordingTabsProps) {
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
          <TabsTrigger
            value="ask"
            disabled
            className="text-muted-foreground/60 h-11 cursor-not-allowed rounded-none px-0 text-[11px] font-semibold tracking-[0.12em] uppercase"
          >
            Ask Fathom
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="summary" className="pt-6">
        <MeetingSummaryPanel
          meeting={meeting}
          onSeek={onSeek}
          canRecreateSummary={meeting.processingStatus === 'ready'}
        />
      </TabsContent>
      <TabsContent value="transcript" className="pt-6">
        <MeetingTranscriptPanel
          meetingId={meeting.id}
          currentTimeSec={currentTimeSec}
          onSeek={onSeek}
        />
      </TabsContent>
    </Tabs>
  )
}

export { MeetingRecordingTabs }
