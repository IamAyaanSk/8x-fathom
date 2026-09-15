import { Outlet, getRouteApi } from '@tanstack/react-router'

import { DashboardLayout } from '#components/layout/dashboard-layout'

const authenticatedRoute = getRouteApi('/_authenticated')

function AuthenticatedLayout() {
  const { session } = authenticatedRoute.useRouteContext()

  return (
    <DashboardLayout user={session.user}>
      <Outlet />
    </DashboardLayout>
  )
}

export { AuthenticatedLayout }
