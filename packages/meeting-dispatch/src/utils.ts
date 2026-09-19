import { meetingBaasOutputTranscriptionSchema } from '@repo/api-contract/meeting-baas-transcript'

import {
  BAAS_STATUS_RANK,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  type BaasStatusToProcess,
  type MeetingProcessingStatus,
  type UIMeetStatus
} from './constants.js'

function mapWebhookStatusToProcessStatus(status: string) {
  return BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP[status] ?? null
}

function getBaasStatusRank(status: BaasStatusToProcess) {
  return BAAS_STATUS_RANK[status]
}

type GetMeetingUiStatusArgs = {
  baasStatus: BaasStatusToProcess | null
  processingStatus: MeetingProcessingStatus
}
function getMeetingUiStatus({
  baasStatus,
  processingStatus
}: GetMeetingUiStatusArgs): UIMeetStatus {
  if (processingStatus === 'ready') return 'ready'

  if (processingStatus === 'failed') return 'failed_processing'

  if (!baasStatus && processingStatus === 'idle') return 'starting_soon'

  if (baasStatus === 'failed') return 'failed_to_join'

  if (baasStatus === 'in_call_recording') return 'in_call_recording'

  if (baasStatus === 'transcribing') return 'transcribing'

  if (baasStatus === 'in_waiting_room') return 'in_waiting_room'

  const callProcessingStates: MeetingProcessingStatus[] = [
    'importing',
    'pending',
    'processing'
  ]

  if (
    baasStatus === 'completed' &&
    callProcessingStates.includes(processingStatus)
  ) {
    return 'call_ended_processing'
  }

  return 'joining'
}

function formatMeetingBaasTranscriptForAgent(rawTranscript: string) {
  const parsedTranscript = meetingBaasOutputTranscriptionSchema.parse(
    JSON.parse(rawTranscript)
  )

  const lines = [...parsedTranscript.result.utterances]
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    .map((utterance) => {
      const text = utterance.text.trim()
      if (!text) return null

      const speaker = utterance.speaker?.trim()
      return speaker ? `${speaker}: ${text}` : text
    })
    .filter((line) => line !== null)

  if (!lines.length) {
    return 'Meeting transcript has no utterances'
  }

  return lines.join('\n')
}

function getMeetingTranscriptData(rawTranscript: string) {
  const parsedTranscript = meetingBaasOutputTranscriptionSchema.parse(
    JSON.parse(rawTranscript)
  )

  const lines = [...parsedTranscript.result.utterances]
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    .map((utterance) => {
      const text = utterance.text.trim()
      if (!text) return null

      return {
        startSec: utterance.start ?? 0,
        endSec: utterance.end ?? utterance.start ?? 0,
        speaker: utterance.speaker?.trim() ?? null,
        text: utterance.text.trim()
      }
    })
    .filter((line) => line !== null)

  return {
    durationSec: parsedTranscript.result.total_duration ?? 0,
    lines
  }
}

export {
  mapWebhookStatusToProcessStatus,
  getMeetingTranscriptData,
  getBaasStatusRank,
  getMeetingUiStatus,
  formatMeetingBaasTranscriptForAgent
}
