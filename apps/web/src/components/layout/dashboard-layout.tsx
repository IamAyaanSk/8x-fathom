import { Button } from '@repo/ui-web/components/button'
import { Link, useNavigate } from '@tanstack/react-router'
import { CircleHelp, LogOut, Settings, Waves } from 'lucide-react'
import type { ReactNode } from 'react'

import { MadeWithLoveByAyaan } from '#components/layout/made-with-love-by-ayaan'
import { authClient } from '#lib/auth-client'

type DashboardLayoutProps = {
  children: ReactNode
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

function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const initials = getUserInitials(user.name, user.email)

  async function handleSignOut() {
    await authClient.signOut()
    await navigate({ to: '/login' })
  }

  return (
    <div className="dark bg-background text-foreground flex min-h-dvh flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
          <Link
            to="/meetings"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <Waves
              aria-hidden
              className="text-primary size-5 sm:size-6"
              strokeWidth={2.25}
            />
            <span className="text-sm font-semibold tracking-[0.2em] sm:text-base">
              8X FATHOM
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hidden sm:inline-flex"
              aria-label="Settings"
            >
              <Settings />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hidden sm:inline-flex"
              aria-label="Help and feedback"
            >
              <CircleHelp />
            </Button>
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="border-border size-8 rounded-full border object-cover"
              />
            ) : (
              <span
                className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium"
                aria-hidden
              >
                {initials}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label="Sign out"
              onClick={() => {
                void handleSignOut()
              }}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>

      <footer className="border-border border-t px-4 py-3 sm:px-6">
        <MadeWithLoveByAyaan />
      </footer>
    </div>
  )
}

export { DashboardLayout }
