import { dispatchDueMeetings } from '@repo/meeting-dispatch'

import { env } from '#src/env'

async function runDispatchTick() {
  try {
    const { dispatchedCount, errors } = await dispatchDueMeetings(
      env.MEETINGBAAS_API_KEY
    )
    console.log(
      `Dispatch tick: dispatched ${dispatchedCount} meeting${dispatchedCount === 1 ? '' : 's'}`
    )
    for (const item of errors) {
      console.error(`Dispatch error for ${item.meetingId}: ${item.message}`)
    }
  } catch (error) {
    console.error('Dispatch tick failed', error)
  }
}

export { runDispatchTick }
