import { createFileRoute } from '@tanstack/react-router'

import { PrivacyPolicyPage } from '#components/pages/privacy-policy-page'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicyPage
})
