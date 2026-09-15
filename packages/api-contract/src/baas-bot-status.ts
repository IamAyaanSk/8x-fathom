/** MeetingBaas v2 bot `status` strings (aligned with Prisma `BaasBotStatus`). */
const BAAS_BOT_STATUSES = [
  'queued',
  'pickup_delayed',
  'awaiting_reconciliation',
  'joining_call',
  'in_waiting_room',
  'in_waiting_for_host',
  'in_call_recording',
  'recording_paused',
  'recording_resumed',
  'in_call_not_recording',
  'call_ended',
  'recording_succeeded',
  'transcribing',
  'completed',
  'api_request_stop',
  'bot_rejected',
  'bot_removed',
  'bot_removed_too_early',
  'waiting_room_timeout',
  'invalid_meeting_url',
  'meeting_error',
  'failed',
  'transcription_failed',
  'recording_failed',
  'MEET_LOGIN_UNAVAILABLE',
  'MEET_LOGIN_REQUIRED',
  'MEET_LOGIN_FAILED_SAML_REJECTED',
  'MEET_LOGIN_FAILED_TIMEOUT'
] as const

type BaasBotStatus = (typeof BAAS_BOT_STATUSES)[number]

const baasBotStatusSet = new Set<string>(BAAS_BOT_STATUSES)

const MEETING_BOT_UI_PHASES = [
  'starting_soon',
  'joining',
  'in_call_recording',
  'call_ended_processing',
  'ready',
  'failed_to_join',
  'failed_processing'
] as const

type MeetingBotUiPhase = (typeof MEETING_BOT_UI_PHASES)[number]

const JOINING_STATUSES = new Set<BaasBotStatus>([
  'queued',
  'pickup_delayed',
  'joining_call',
  'in_waiting_room',
  'in_waiting_for_host',
  'awaiting_reconciliation'
])

const IN_CALL_STATUSES = new Set<BaasBotStatus>([
  'in_call_recording',
  'recording_resumed',
  'recording_paused',
  'in_call_not_recording'
])

const PROCESSING_STATUSES = new Set<BaasBotStatus>([
  'call_ended',
  'recording_succeeded',
  'transcribing',
  'api_request_stop'
])

const FAILED_JOIN_STATUSES = new Set<BaasBotStatus>([
  'bot_rejected',
  'invalid_meeting_url',
  'meeting_error',
  'waiting_room_timeout',
  'bot_removed_too_early',
  'bot_removed',
  'MEET_LOGIN_UNAVAILABLE',
  'MEET_LOGIN_REQUIRED',
  'MEET_LOGIN_FAILED_SAML_REJECTED',
  'MEET_LOGIN_FAILED_TIMEOUT'
])

const FAILED_PROCESSING_STATUSES = new Set<BaasBotStatus>([
  'failed',
  'transcription_failed',
  'recording_failed'
])

const TERMINAL_BAAS_STATUSES: BaasBotStatus[] = [
  'completed',
  ...FAILED_JOIN_STATUSES,
  ...FAILED_PROCESSING_STATUSES
]

const terminalBaasStatusSet = new Set<BaasBotStatus>(TERMINAL_BAAS_STATUSES)

const MEETING_BOT_UI_LABELS: Record<MeetingBotUiPhase, string> = {
  starting_soon: 'Starting soon',
  joining: 'Joining…',
  in_call_recording: 'In call — recording',
  call_ended_processing: 'Call ended, processing…',
  ready: 'Ready',
  failed_to_join: 'Failed to join',
  failed_processing: 'Failed processing'
}

const ACTIVE_BOT_UI_PHASES = new Set<MeetingBotUiPhase>([
  'joining',
  'in_call_recording',
  'call_ended_processing'
])

function isBaasBotStatus(value: string): value is BaasBotStatus {
  return baasBotStatusSet.has(value)
}

function parseBaasApiStatus(status: string): BaasBotStatus {
  if (isBaasBotStatus(status)) {
    return status
  }
  throw new Error(`Unknown MeetingBaas bot status: ${status}`)
}

function getMeetingBotUiPhase({
  baasBotId,
  baasStatus
}: {
  baasBotId: string | null
  baasStatus: BaasBotStatus | null
}): MeetingBotUiPhase {
  if (!baasBotId) {
    return 'starting_soon'
  }
  if (!baasStatus || JOINING_STATUSES.has(baasStatus)) {
    return 'joining'
  }
  if (IN_CALL_STATUSES.has(baasStatus)) {
    return 'in_call_recording'
  }
  if (PROCESSING_STATUSES.has(baasStatus)) {
    return 'call_ended_processing'
  }
  if (baasStatus === 'completed') {
    return 'ready'
  }
  if (FAILED_JOIN_STATUSES.has(baasStatus)) {
    return 'failed_to_join'
  }
  if (FAILED_PROCESSING_STATUSES.has(baasStatus)) {
    return 'failed_processing'
  }

  return 'joining'
}

function getMeetingBotUiLabel(phase: MeetingBotUiPhase): string {
  return MEETING_BOT_UI_LABELS[phase]
}

function isTerminalBaasStatus(
  status: BaasBotStatus | null
): status is BaasBotStatus {
  return status != null && terminalBaasStatusSet.has(status)
}

function isFailedMeetingBotUiPhase(phase: MeetingBotUiPhase): boolean {
  return phase === 'failed_to_join' || phase === 'failed_processing'
}

function isActiveMeetingBotUiPhase(phase: MeetingBotUiPhase): boolean {
  return ACTIVE_BOT_UI_PHASES.has(phase)
}

export type { BaasBotStatus, MeetingBotUiPhase }
export {
  BAAS_BOT_STATUSES,
  MEETING_BOT_UI_PHASES,
  TERMINAL_BAAS_STATUSES,
  getMeetingBotUiLabel,
  getMeetingBotUiPhase,
  isActiveMeetingBotUiPhase,
  isBaasBotStatus,
  isFailedMeetingBotUiPhase,
  isTerminalBaasStatus,
  parseBaasApiStatus
}
