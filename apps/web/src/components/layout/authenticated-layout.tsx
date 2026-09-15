import { TooltipProvider } from '@repo/ui-web/components/tooltip'
import { Outlet, getRouteApi } from '@tanstack/react-router'

import { DashboardLayout } from '#components/layout/dashboard-layout'

const authenticatedRoute = getRouteApi('/_authenticated')

function AuthenticatedLayout() {
  const { session } = authenticatedRoute.useRouteContext()

  return (
    <TooltipProvider>
      <DashboardLayout user={session.user}>
        <Outlet />
      </DashboardLayout>
    </TooltipProvider>
  )
}

export { AuthenticatedLayout }
