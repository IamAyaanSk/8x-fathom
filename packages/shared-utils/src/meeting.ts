import {
  meetingBaasChatMessagesFileSchema,
  meetingBaasOutputTranscriptionSchema,
  BAAS_STATUS_MAP,
  BAAS_STATUS_RANK,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  type BaasStatusToProcess,
  type MeetingProcessingStatus,
  type UIMeetStatus
} from '@repo/shared-validations/meeting'
import { DateTime } from 'luxon'

import { MEETING_CAPTURE_LEAD_MS } from './constants.js'

function mapBaasStatus(status: string) {
  return BAAS_STATUS_MAP[status] ?? undefined
}

function mapWebhookStatusToProcessStatus(status: string) {
  return BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP[status] ?? undefined
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

const ACTIVE_BOT_UI_STATUSES = new Set<UIMeetStatus>([
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
  'call_ended_processing'
])

function isActiveMeetingBotUiPhase(status: UIMeetStatus): boolean {
  return ACTIVE_BOT_UI_STATUSES.has(status)
}

const MEETING_BOT_UI_LABELS: Record<UIMeetStatus, string> = {
  starting_soon: 'Starting soon',
  joining: 'Joining…',
  in_waiting_room: 'In waiting room…',
  in_call_recording: 'In call — recording',
  transcribing: 'Transcribing…',
  call_ended_processing: 'Call ended, processing…',
  ready: 'Ready',
  failed_to_join: 'Failed to join',
  failed_processing: 'Failed processing'
}

function getMeetingBotUiLabel(
  status: UIMeetStatus,
  baasStatus?: BaasStatusToProcess | null
): string {
  if (status === 'joining' && baasStatus === 'in_waiting_room') {
    return 'In waiting room…'
  }
  return MEETING_BOT_UI_LABELS[status]
}

type CanDispatchNewBotArgs = {
  baasStatus: BaasStatusToProcess | null
  processingStatus: MeetingProcessingStatus
}

function canDispatchNewBot({
  processingStatus,
  baasStatus
}: CanDispatchNewBotArgs): boolean {
  if (baasStatus === 'completed') {
    return false
  }
  if (
    processingStatus === 'importing' ||
    processingStatus === 'pending' ||
    processingStatus === 'processing' ||
    processingStatus === 'ready'
  ) {
    return false
  }
  if (!baasStatus || baasStatus === 'failed') {
    return true
  }
  return false
}

function _parseStartMs(startTimeIso: string): number | null {
  const dt = DateTime.fromISO(startTimeIso)
  return dt.isValid ? dt.toMillis() : null
}

function isInBotJoiningSoonWindow(
  startTimeIso: string,
  nowMs = DateTime.now().toMillis()
): boolean {
  const startMs = _parseStartMs(startTimeIso)
  if (startMs == null) {
    return false
  }
  return nowMs >= startMs - MEETING_CAPTURE_LEAD_MS && nowMs < startMs
}

function isMeetingEnded(
  endTimeIso: string,
  nowMs = DateTime.now().toMillis()
): boolean {
  const dt = DateTime.fromISO(endTimeIso)
  if (!dt.isValid) {
    return true
  }
  return dt.toMillis() <= nowMs
}

function isManualCaptureAllowed(
  startTimeIso: string,
  nowMs = DateTime.now().toMillis()
): boolean {
  const startMs = _parseStartMs(startTimeIso)
  if (startMs == null) {
    return false
  }
  return nowMs < startMs - MEETING_CAPTURE_LEAD_MS || nowMs >= startMs
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

function getMeetingChatMessagesData(rawChatMessages: string) {
  const parsed = meetingBaasChatMessagesFileSchema.parse(
    JSON.parse(rawChatMessages)
  )

  return [...parsed]
    .sort(
      (a, b) =>
        DateTime.fromISO(a.timestamp).toMillis() -
        DateTime.fromISO(b.timestamp).toMillis()
    )
    .map((message) => ({
      baasMessageId: message.message_id,
      senderName: message.sender_name,
      baasSenderId: message.sender_id ?? null,
      text: message.text,
      sentAt: DateTime.fromISO(message.timestamp).toJSDate()
    }))
}

function isParticipantBot(name: string) {
  const lowercasedName = name.toLowerCase()
  const isNoteTakerInName = lowercasedName.includes('notetaker')
  const isBotInName =
    lowercasedName.includes('8x') ||
    lowercasedName.includes('bot') ||
    lowercasedName.includes('meetingbaas')

  if (isNoteTakerInName || isBotInName) return true

  return false
}

export {
  mapWebhookStatusToProcessStatus,
  mapBaasStatus,
  getMeetingChatMessagesData,
  getMeetingTranscriptData,
  getBaasStatusRank,
  getMeetingUiStatus,
  formatMeetingBaasTranscriptForAgent,
  canDispatchNewBot,
  isParticipantBot,
  isInBotJoiningSoonWindow,
  isMeetingEnded,
  isManualCaptureAllowed,
  ACTIVE_BOT_UI_STATUSES,
  isActiveMeetingBotUiPhase,
  MEETING_BOT_UI_LABELS,
  getMeetingBotUiLabel
}
