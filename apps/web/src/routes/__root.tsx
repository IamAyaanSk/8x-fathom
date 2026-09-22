// In future if we had a usecase where we need route types in some shared package, we can extract routes to a seperate package as per official example
// https://tanstack.com/router/latest/docs/framework/react/examples/router-monorepo-react-query

import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootLayout } from '#components/layout/root-layout'
import { RootNotFound } from '#components/layout/root-not-found'
import { RootPending } from '#components/layout/root-pending'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootLayout,
  pendingComponent: RootPending,
  notFoundComponent: RootNotFound
})
