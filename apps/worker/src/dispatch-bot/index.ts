import { dispatchDueMeetings } from '@repo/meeting-dispatch'

import { env } from '#src/env'

export async function dispatchBotForDueMeetings() {
  try {
    const { dispatchedCount, errors } = await dispatchDueMeetings({
      meetingBaasApiKey: env.MEETINGBAAS_API_KEY,
      excludedUserEmail: env.DEMO_USER_EMAIL,
      callbackBaseUrl: env.BASE_URL,
      webhookSecret: env.MEETINGBAAS_WEBHOOK_SECRET,
      transcriptionApiKey: env.DEEPGRAM_API_KEY
    })
    console.log(
      `Dispatch tick: dispatched ${dispatchedCount} meeting${dispatchedCount === 1 ? '' : 's'}`
    )
    for (const item of errors) {
      console.error(`Dispatch error for ${item.meetingId}: ${item.message}`)
    }
  } catch (error) {
    console.error('Failed to execute dispatch bot worker', error)
  }
}
