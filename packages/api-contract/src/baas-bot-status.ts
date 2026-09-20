/** Stored bot lifecycle. MeetingBaas API codes are mapped onto these. */
const BAAS_BOT_STATUSES = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
  'completed',
  'failed'
] as const

type BaasBotStatus = (typeof BAAS_BOT_STATUSES)[number]

const BAAS_API_STATUS_TO_STORED: Record<string, BaasBotStatus> = {
  queued: 'joining',
  pickup_delayed: 'joining',
  awaiting_reconciliation: 'joining',
  joining_call: 'joining',
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_waiting_for_host: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  recording_paused: 'in_call_recording',
  recording_resumed: 'in_call_recording',
  in_call_not_recording: 'in_call_recording',
  call_ended: 'transcribing',
  recording_succeeded: 'transcribing',
  transcribing: 'transcribing',
  completed: 'completed',
  api_request_stop: 'transcribing',
  failed: 'failed',
  bot_rejected: 'failed',
  bot_removed: 'failed',
  bot_removed_too_early: 'failed',
  waiting_room_timeout: 'failed',
  invalid_meeting_url: 'failed',
  meeting_error: 'failed',
  transcription_failed: 'failed',
  recording_failed: 'failed',
  MEET_LOGIN_UNAVAILABLE: 'failed',
  MEET_LOGIN_REQUIRED: 'failed',
  MEET_LOGIN_FAILED_SAML_REJECTED: 'failed',
  MEET_LOGIN_FAILED_TIMEOUT: 'failed'
}

const BAAS_STATUS_RANK: Record<BaasBotStatus, number> = {
  joining: 1,
  in_waiting_room: 2,
  in_call_recording: 3,
  transcribing: 4,
  completed: 5,
  failed: 6
}

const TERMINAL_BAAS_STATUSES: BaasBotStatus[] = [
  'transcribing',
  'completed',
  'failed'
]

const MEETING_PROCESSING_STATUSES = [
  'idle',
  'importing',
  'pending',
  'processing',
  'ready',
  'failed'
] as const

type MeetingProcessingStatus = (typeof MEETING_PROCESSING_STATUSES)[number]

const MEETING_BOT_UI_PHASES = [
  'starting_soon',
  'joining',
  'in_call_recording',
  'transcribing',
  'call_ended_processing',
  'ready',
  'failed_to_join',
  'failed_processing',
  'in_waiting_room'
] as const

type MeetingBotUiPhase = (typeof MEETING_BOT_UI_PHASES)[number]

const MEETING_BOT_UI_LABELS: Record<MeetingBotUiPhase, string> = {
  starting_soon: 'Starting soon',
  joining: 'Joining…',
  in_call_recording: 'In call — recording',
  transcribing: 'Transcribing…',
  call_ended_processing: 'Call ended, processing…',
  ready: 'Ready',
  failed_to_join: 'Failed to join',
  failed_processing: 'Failed processing',
  in_waiting_room: 'In waiting room'
}

const ACTIVE_BOT_UI_PHASES = new Set<MeetingBotUiPhase>([
  'joining',
  'in_call_recording',
  'transcribing',
  'call_ended_processing'
])

type MeetingBotStateFields = {
  baasBotId: string | null
  baasStatus: BaasBotStatus | null
  recordingStartedAt: Date | null
  processingStatus: MeetingProcessingStatus
}

type MeetingBaasStatusPatch = {
  baasStatus?: BaasBotStatus
  recordingStartedAt?: Date
  processingStatus?: MeetingProcessingStatus
}

function mapBaasApiStatus(status: string): BaasBotStatus | null {
  return BAAS_API_STATUS_TO_STORED[status] ?? null
}

function _shouldApplyBaasStatus(
  current: BaasBotStatus | null,
  next: BaasBotStatus
): boolean {
  if (current === next) {
    return false
  }
  if (current == null) {
    return true
  }
  if (current === 'failed') {
    return false
  }
  if (next === 'failed') {
    return true
  }
  return BAAS_STATUS_RANK[next] > BAAS_STATUS_RANK[current]
}

function getMeetingBotUiLabel(
  phase: MeetingBotUiPhase,
  baasStatus?: BaasBotStatus | null
): string {
  if (phase === 'joining' && baasStatus === 'in_waiting_room') {
    return 'In waiting room…'
  }
  return MEETING_BOT_UI_LABELS[phase]
}

function isActiveMeetingBotUiPhase(phase: MeetingBotUiPhase): boolean {
  return ACTIVE_BOT_UI_PHASES.has(phase)
}

/** MeetingBaas `start_time` may be Unix seconds or milliseconds. */
function baasRecordingStartedAtFromStartTime(
  startTime?: number
): Date | undefined {
  if (startTime == null || !Number.isFinite(startTime)) {
    return undefined
  }
  const epochMs = startTime > 1e11 ? startTime : startTime * 1000
  const date = new Date(epochMs)
  if (!Number.isFinite(date.getTime())) {
    return undefined
  }
  return date
}

function patchFromBaasStatusChange(
  meeting: MeetingBotStateFields,
  rawStatus: string,
  recordingStartTimeSec?: number
): MeetingBaasStatusPatch | null {
  const nextStatus = mapBaasApiStatus(rawStatus)
  if (!nextStatus) {
    return null
  }

  const applyStatus = _shouldApplyBaasStatus(meeting.baasStatus, nextStatus)
  const recordingStartedAt =
    nextStatus === 'in_call_recording' && meeting.recordingStartedAt == null
      ? baasRecordingStartedAtFromStartTime(recordingStartTimeSec)
      : undefined

  if (!applyStatus && recordingStartedAt == null) {
    return null
  }

  return {
    ...(applyStatus ? { baasStatus: nextStatus } : {}),
    ...(recordingStartedAt ? { recordingStartedAt } : {})
  }
}

function patchFromBaasFailed(
  meeting: MeetingBotStateFields
): MeetingBaasStatusPatch | null {
  if (!_shouldApplyBaasStatus(meeting.baasStatus, 'failed')) {
    return null
  }
  return { baasStatus: 'failed' }
}

export type {
  BaasBotStatus,
  MeetingBotUiPhase,
  MeetingProcessingStatus,
  MeetingBaasStatusPatch,
  MeetingBotStateFields
}
export {
  BAAS_BOT_STATUSES,
  MEETING_BOT_UI_PHASES,
  MEETING_PROCESSING_STATUSES,
  TERMINAL_BAAS_STATUSES,
  getMeetingBotUiLabel,
  isActiveMeetingBotUiPhase,
  mapBaasApiStatus,
  patchFromBaasFailed,
  patchFromBaasStatusChange
}
