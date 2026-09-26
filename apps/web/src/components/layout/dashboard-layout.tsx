import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import { useMeetingsCompletedQuery } from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'
import {
  SidebarInset,
  SidebarProvider,
  useSidebar
} from '@repo/ui-web/components/sidebar'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import { AppSidebar } from '#components/layout/app-sidebar'
import { CalendarSyncButton } from '#components/meetings/calendar-sync-button'
import { MeetingAskFathomSheet } from '#components/meetings/meeting-ask-fathom-sheet'

type DashboardLayoutProps = {
  children: ReactNode
  user: {
    name: string
    email: string
    image?: string | null
  }
}

function DashboardHeader() {
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const { data: statusData } = useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected

  const { data: completedData, isPending: completedPending } =
    useMeetingsCompletedQuery({ enabled: connected === true })

  const past =
    completedData?.success === true ? completedData.data.meetings : []
  const hasReadyCalls = past.some((m) => m.uiPhase === 'ready')

  const askDisabledReason = !connected
    ? 'Connect your calendar first'
    : completedPending
      ? 'AI is available after calls load.'
      : hasReadyCalls
        ? undefined
        : 'AI is available after at least one call is processed.'

  const isMeetingDetail =
    location.pathname.startsWith('/meetings/') &&
    location.pathname !== '/meetings' &&
    location.pathname !== '/meetings/' &&
    location.pathname !== '/meetings/upcoming' &&
    location.pathname !== '/meetings/live' &&
    location.pathname !== '/meetings/my-calls'

  const viewTitle =
    location.pathname === '/meetings/live'
      ? 'Live Calls'
      : location.pathname === '/meetings/my-calls'
        ? 'My Calls'
        : isMeetingDetail
          ? 'Meeting Playback'
          : 'Upcoming Calls'

  return (
    <header className="border-border/70 bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b p-[35.5px] px-4 supports-backdrop-filter:backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2.5">
        {isMobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpenMobile(true)}
            aria-label="Open menu"
            className="text-muted-foreground hover:text-foreground -ml-1 md:hidden"
          >
            <Menu className="size-5" />
          </Button>
        ) : null}

        {isMeetingDetail ? (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm"
          >
            <Link
              to="/meetings/upcoming"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Calls
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-foreground font-semibold">Recording</span>
          </nav>
        ) : (
          <h1 className="text-foreground font-sans text-sm font-semibold tracking-tight sm:text-base">
            {viewTitle}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {connected ? <CalendarSyncButton iconOnly showSyncedTime /> : null}

        <MeetingAskFathomSheet
          disabledReason={askDisabledReason}
          trigger={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={askDisabledReason != null}
              title={askDisabledReason ?? 'Ask your meetings with AI'}
              className="h-8 cursor-pointer gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-xs"
            >
              <Sparkles className="size-3.5" />
              <span>Ask your meetings</span>
            </Button>
          }
        />
      </div>
    </header>
  )
}

function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { DashboardLayout }
