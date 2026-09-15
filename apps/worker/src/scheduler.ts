import { dispatchDueMeetings } from '@repo/meeting-dispatch'

import { env } from '#src/env'
import { runPendingMeetingProcessing } from '#src/process-pending-meetings'
import { runActiveBotStatusSync } from '#src/sync-active-bot-status'

function _dispatchCallbackParams() {
  return {
    meetingBaasApiKey: env.MEETINGBAAS_API_KEY,
    callbackBaseUrl: env.BASE_URL,
    webhookSecret: env.MEETINGBAAS_WEBHOOK_SECRET,
    transcriptionApiKey: env.DEEPGRAM_API_KEY
  }
}

async function runDispatchTick() {
  try {
    const { dispatchedCount, errors } = await dispatchDueMeetings(
      _dispatchCallbackParams()
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

async function runStatusPollTick() {
  try {
    const { checkedCount, updatedCount } = await runActiveBotStatusSync()
    if (checkedCount === 0) {
      return
    }
    console.log(`Status poll: checked ${checkedCount}, updated ${updatedCount}`)
  } catch (error) {
    console.error('Status poll failed', error)
  }
}

async function runPendingProcessingTick() {
  try {
    const { pickedCount } = await runPendingMeetingProcessing()
    if (pickedCount === 0) {
      return
    }
    console.log(
      `Pending processing: picked ${pickedCount} meeting${pickedCount === 1 ? '' : 's'}`
    )
  } catch (error) {
    console.error('Pending processing tick failed', error)
  }
}

export { runDispatchTick, runPendingProcessingTick, runStatusPollTick }
