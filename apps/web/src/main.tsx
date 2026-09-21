import { configureApiClient } from '@repo/api-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@repo/ui-web/globals.css'
import { axiosInstance } from '#lib/http-client'
import { routeTree } from '#src/routeTree.gen'

const queryClient = new QueryClient()
configureApiClient(axiosInstance)

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultPendingMs: 0,
  defaultPendingMinMs: 150
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
