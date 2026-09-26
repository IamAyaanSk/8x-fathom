import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/meetings/')({
  beforeLoad: () => {
    throw redirect({ to: '/meetings/upcoming' })
  }
})
