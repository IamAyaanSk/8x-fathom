import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'
import { cn } from '@repo/ui-web/lib/utils'

import { MeetingLiveHighlightPanel } from '#components/meetings/meeting-live-highlight-panel'
import { MeetingLiveScratchpadPanel } from '#components/meetings/meeting-live-scratchpad-panel'

const tabTriggerClassName = cn(
  'h-9 flex-1 rounded-lg text-sm font-medium',
  'data-active:bg-primary data-active:text-primary-foreground'
)

type MeetingLiveCapturePanelProps = {
  meeting: MeetingDetail
  meetingId: string
}

function MeetingLiveCapturePanel({
  meeting,
  meetingId
}: MeetingLiveCapturePanelProps) {
  return (
    <Tabs defaultValue="highlight" className="gap-4">
      <TabsList className="bg-muted/50 grid w-full grid-cols-2 p-1">
        <TabsTrigger value="highlight" className={tabTriggerClassName}>
          Highlight
        </TabsTrigger>
        <TabsTrigger value="scratchpad" className={tabTriggerClassName}>
          Scratchpad
        </TabsTrigger>
      </TabsList>
      <TabsContent value="highlight" className="mt-0">
        <MeetingLiveHighlightPanel meeting={meeting} meetingId={meetingId} />
      </TabsContent>
      <TabsContent value="scratchpad" className="mt-0">
        <MeetingLiveScratchpadPanel meeting={meeting} meetingId={meetingId} />
      </TabsContent>
    </Tabs>
  )
}

export { MeetingLiveCapturePanel }
