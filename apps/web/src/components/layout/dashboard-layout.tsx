import {
  SidebarInset,
  SidebarProvider,
  useSidebar
} from '@repo/ui-web/components/sidebar'
import { Button } from '@repo/ui-web/components/button'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'

import { AppSidebar } from '#components/layout/app-sidebar'
import { FloatingAskFathom } from '#components/meetings/floating-ask-fathom'

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
    <header className="border-border/70 bg-background/80 supports-backdrop-filter:backdrop-blur-md sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        {isMobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpenMobile(true)}
            aria-label="Open menu"
            className="md:hidden -ml-1 text-muted-foreground hover:text-foreground"
          >
            <Menu className="size-5" />
          </Button>
        ) : null}

        {isMeetingDetail ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
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
        <FloatingAskFathom />
      </SidebarInset>
    </SidebarProvider>
  )
}

export { DashboardLayout }
