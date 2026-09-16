import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@repo/ui-web/components/tabs'
import { cn } from '@repo/ui-web/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { MyCallsGrid } from '#components/meetings/my-calls-grid'
import { UpcomingMeetingRow } from '#components/meetings/upcoming-meeting-row'
import type { CategorizedMeetings } from '#lib/meeting-call-tabs'

const tabTriggerClassName = cn(
  'h-auto flex-none rounded-none px-0 pb-3 text-base font-medium text-foreground/80 shadow-none',
  'hover:text-foreground data-active:text-primary data-active:shadow-none',
  'after:bottom-0 after:h-0.5 after:bg-primary data-active:after:opacity-100',
  'dark:text-foreground/80 dark:hover:text-foreground dark:data-active:text-primary'
)

type MeetingCallsTabsProps = {
  categories: CategorizedMeetings
  isLoading: boolean
  isError: boolean
  nowMs: number
  onRetry: () => void
  toolbarEnd?: ReactNode
}

function MeetingCallsList({
  meetings,
  emptyTitle,
  emptyDescription
}: {
  meetings: MeetingListItem[]
  emptyTitle: string
  emptyDescription: string
}) {
  if (meetings.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-foreground text-sm font-medium">{emptyTitle}</p>
        <p className="text-muted-foreground mt-2 text-sm">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ul className="border-border border-t">
      {meetings.map((meeting) => (
        <UpcomingMeetingRow key={meeting.id} meeting={meeting} />
      ))}
    </ul>
  )
}

function MeetingCallsTabBar() {
  return (
    <TabsList
      variant="line"
      className="h-auto min-w-0 flex-1 justify-start gap-6 bg-transparent p-0 sm:gap-8"
    >
      <TabsTrigger value="upcoming" className={tabTriggerClassName}>
        Upcoming Calls
      </TabsTrigger>
      <TabsTrigger value="live" className={tabTriggerClassName}>
        Live Calls
      </TabsTrigger>
      <TabsTrigger value="my-calls" className={tabTriggerClassName}>
        My Calls
      </TabsTrigger>
    </TabsList>
  )
}

function MeetingCallsTabs({
  categories,
  isLoading,
  isError,
  nowMs,
  onRetry,
  toolbarEnd
}: MeetingCallsTabsProps) {
  return (
    <Tabs defaultValue="upcoming" className="gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4 gap-y-3">
        <MeetingCallsTabBar />
        {toolbarEnd ? (
          <div className="flex shrink-0 items-center gap-2 pb-1">{toolbarEnd}</div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2
            aria-hidden
            className="text-muted-foreground size-6 animate-spin"
          />
          <p className="text-muted-foreground text-sm">Loading calls…</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-destructive text-sm">Could not load your calls.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <TabsContent value="upcoming" className="mt-0">
            <MeetingCallsList
              meetings={categories.upcoming}
              emptyTitle="No upcoming calls"
              emptyDescription="Future calls with a video link appear here until they finish or the scheduled end time passes."
            />
          </TabsContent>

          <TabsContent value="live" className="mt-0">
            <MeetingCallsList
              meetings={categories.live}
              emptyTitle="No live calls"
              emptyDescription="When a bot is in the meeting and recording, the call shows up here."
            />
          </TabsContent>

          <TabsContent value="my-calls" className="mt-0">
            <MyCallsGrid meetings={categories.myCalls} nowMs={nowMs} />
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}

export { MeetingCallsTabs }
