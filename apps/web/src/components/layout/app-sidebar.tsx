import { useCalendarStatusQuery } from '@repo/api-client/v1/calendar/hooks'
import {
  useMeetingsCompletedQuery,
  useMeetingsLiveQuery,
  useMeetingsUpcomingQuery
} from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@repo/ui-web/components/sidebar'
import { cn } from '@repo/ui-web/lib/utils'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { CalendarDays, LogOut, Radio, Video, Waves } from 'lucide-react'

import { MadeWithLoveByAyaan } from '#components/layout/made-with-love-by-ayaan'
import { authClient } from '#lib/auth-client'
import { isDemoUser } from '#lib/demo'

type AppSidebarProps = {
  user: {
    name: string
    email: string
    image?: string | null
  }
}

function getUserInitials(name: string, email: string): string {
  const trimmed = name.trim()
  if (trimmed.length > 0) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    }
    return trimmed.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function AppSidebar({ user }: AppSidebarProps) {
  const isDemo = isDemoUser(user.email)
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const { data: calendarStatus } = useCalendarStatusQuery()
  const connected =
    calendarStatus?.success === true && calendarStatus.data.connected
  const canAccess = connected || isDemo

  const { data: upcomingData } = useMeetingsUpcomingQuery({
    enabled: canAccess
  })
  const { data: liveData } = useMeetingsLiveQuery({
    enabled: canAccess
  })
  const { data: completedData } = useMeetingsCompletedQuery({
    enabled: canAccess
  })

  const upcomingCount =
    upcomingData?.success === true ? upcomingData.data.meetings.length : 0
  const liveCount =
    liveData?.success === true ? liveData.data.meetings.length : 0
  const myCallsCount =
    completedData?.success === true ? completedData.data.meetings.length : 0

  const initials = getUserInitials(user.name, user.email)

  async function handleSignOut() {
    await authClient.signOut()
    await navigate({ to: '/login' })
  }

  function handleLinkClick() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const isUpcomingActive =
    location.pathname === '/meetings/upcoming' ||
    location.pathname === '/meetings' ||
    location.pathname === '/meetings/'
  const isLiveActive = location.pathname === '/meetings/live'
  const isMyCallsActive = location.pathname === '/meetings/my-calls'

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          to="/meetings/upcoming"
          className="hover:bg-sidebar-accent flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
          onClick={handleLinkClick}
        >
          <div className="bg-primary/10 text-primary border-primary/20 flex size-8 shrink-0 items-center justify-center rounded-lg border">
            <Waves className="size-4.5" strokeWidth={2.5} />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sidebar-foreground truncate font-sans text-sm font-bold tracking-wide">
              8X FATHOM
            </span>
            <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
              AI Meeting Assistant
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Calls</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isUpcomingActive}>
                  <Link to="/meetings/upcoming" onClick={handleLinkClick}>
                    <CalendarDays className="size-4 shrink-0" />
                    <span>Upcoming Calls</span>
                    {upcomingCount > 0 ? (
                      <SidebarMenuBadge>{upcomingCount}</SidebarMenuBadge>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLiveActive}>
                  <Link to="/meetings/live" onClick={handleLinkClick}>
                    <Radio
                      className={cn(
                        'size-4 shrink-0',
                        liveCount > 0
                          ? 'text-destructive animate-pulse'
                          : 'text-sidebar-foreground/70'
                      )}
                    />
                    <span>Live Calls</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isMyCallsActive}>
                  <Link to="/meetings/my-calls" onClick={handleLinkClick}>
                    <Video className="size-4 shrink-0" />
                    <span>My Calls</span>
                    {myCallsCount > 0 ? (
                      <SidebarMenuBadge>{myCallsCount}</SidebarMenuBadge>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="hover:bg-sidebar-accent/50 flex items-center gap-2.5 rounded-lg p-1.5 transition-colors">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="border-sidebar-border size-8 shrink-0 rounded-full border object-cover"
            />
          ) : (
            <span
              className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              aria-hidden
            >
              {initials}
            </span>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sidebar-foreground truncate text-xs font-semibold">
              {user.name}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">
              {user.email}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground ml-auto"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              void handleSignOut()
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>

        <div className="pt-1">
          <MadeWithLoveByAyaan />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export { AppSidebar }
