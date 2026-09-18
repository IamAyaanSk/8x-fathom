import type { MeetingBaasOutputTranscription } from '@repo/api-contract/meeting-baas-transcript'

import {
  BAAS_STATUS_RANK,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  type BaasStatusToProcess
} from './constants.js'

function mapWebhookStatusToProcessStatus(status: string) {
  return BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP[status] ?? null
}

function getBaasStatusRank(status: BaasStatusToProcess) {
  return BAAS_STATUS_RANK[status]
}

function formatMeetingBaasTranscript(
  transcription: MeetingBaasOutputTranscription
): string {
  const lines = [...transcription.result.utterances]
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    .map((utterance) => {
      const text = utterance.text.trim()
      if (!text) return null

      const speaker = utterance.speaker?.trim()
      return speaker ? `${speaker}: ${text}` : text
    })
    .filter(Boolean)

  if (!lines.length) {
    return 'Meeting transcript has no utterances'
  }

  return lines.join('\n')
}

export {
  mapWebhookStatusToProcessStatus,
  getBaasStatusRank,
  formatMeetingBaasTranscript
}
