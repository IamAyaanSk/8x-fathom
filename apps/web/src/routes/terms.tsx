import { createFileRoute } from '@tanstack/react-router'

import { TermsOfServicePage } from '#components/pages/terms-of-service-page'

export const Route = createFileRoute('/terms')({
  component: TermsOfServicePage
})
