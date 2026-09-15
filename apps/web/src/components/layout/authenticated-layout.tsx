import { Button } from '@repo/ui-web/components/button'
import { getRouteApi, Link, Outlet, useNavigate } from '@tanstack/react-router'

import { authClient } from '#lib/auth-client'

const authenticatedRoute = getRouteApi('/_authenticated')

function AuthenticatedLayout() {
  const { session } = authenticatedRoute.useRouteContext()
  const navigate = useNavigate()

  async function handleSignOut() {
    await authClient.signOut()
    await navigate({ to: '/login' })
  }

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header className="border-border flex items-center justify-between border-b px-4 py-3">
        <p className="font-semibold">8x Fathom</p>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {session.user.name}
          </span>
          <Link
            to="/users"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            Users
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void handleSignOut()
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}

export { AuthenticatedLayout }
