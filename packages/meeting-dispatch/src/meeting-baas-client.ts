import { createBaasClient } from '@meeting-baas/sdk'

function createMeetingBaasClient(apiKey: string) {
  return createBaasClient({
    api_key: apiKey,
    api_version: 'v2'
  })
}

export { createMeetingBaasClient }
