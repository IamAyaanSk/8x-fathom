import { getRouteApi } from '@tanstack/react-router'

const authenticatedRoute = getRouteApi('/_authenticated')

function HomePage() {
  const { session } = authenticatedRoute.useRouteContext()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Meetings</h1>
      <p className="text-muted-foreground">
        Signed in as {session.user.email}. Upcoming events show up here in the
        next slice.
      </p>
    </div>
  )
}

export { HomePage }
