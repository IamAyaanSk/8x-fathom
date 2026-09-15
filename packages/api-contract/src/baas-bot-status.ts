/** Stored bot lifecycle. MeetingBaas API codes are mapped onto these. */
const BAAS_BOT_STATUSES = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
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
  completed: 'transcribing',
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
  failed: 5
}

const TERMINAL_BAAS_STATUSES: BaasBotStatus[] = ['transcribing', 'failed']

const MEETING_PROCESSING_STATUSES = [
  'idle',
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
  'call_ended_processing',
  'ready',
  'failed_to_join',
  'failed_processing'
] as const

type MeetingBotUiPhase = (typeof MEETING_BOT_UI_PHASES)[number]

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

function shouldApplyBaasStatus(
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

function canDispatchNewBot(meeting: MeetingBotStateFields): boolean {
  if (meeting.recordingStartedAt != null) {
    return false
  }
  if (
    meeting.processingStatus === 'pending' ||
    meeting.processingStatus === 'processing' ||
    meeting.processingStatus === 'ready'
  ) {
    return false
  }
  if (!meeting.baasBotId) {
    return true
  }
  return meeting.baasStatus === 'failed'
}

function getMeetingBotUiPhase(
  meeting: MeetingBotStateFields
): MeetingBotUiPhase {
  if (meeting.processingStatus === 'ready') {
    return 'ready'
  }
  if (meeting.processingStatus === 'failed') {
    return 'failed_processing'
  }
  if (!meeting.baasBotId) {
    return 'starting_soon'
  }
  if (meeting.baasStatus === 'failed') {
    return meeting.recordingStartedAt != null
      ? 'failed_processing'
      : 'failed_to_join'
  }
  if (meeting.baasStatus === 'in_call_recording') {
    return 'in_call_recording'
  }
  if (
    meeting.baasStatus === 'transcribing' ||
    meeting.processingStatus === 'pending' ||
    meeting.processingStatus === 'processing'
  ) {
    return 'call_ended_processing'
  }
  return 'joining'
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

function _processingPatchFromRaw(
  rawStatus: string,
  current: MeetingProcessingStatus
): MeetingProcessingStatus | undefined {
  if (current === 'ready' || current === 'failed' || current === 'processing') {
    return undefined
  }
  if (rawStatus === 'transcribing') {
    return 'processing'
  }
  if (rawStatus === 'completed' && current === 'idle') {
    return 'pending'
  }
  return undefined
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

  const applyStatus = shouldApplyBaasStatus(meeting.baasStatus, nextStatus)
  const processingStatus = _processingPatchFromRaw(
    rawStatus,
    meeting.processingStatus
  )
  const recordingStartedAt =
    nextStatus === 'in_call_recording' &&
    recordingStartTimeSec != null &&
    meeting.recordingStartedAt == null
      ? new Date(recordingStartTimeSec * 1000)
      : undefined

  if (!applyStatus && processingStatus == null && recordingStartedAt == null) {
    return null
  }

  return {
    ...(applyStatus ? { baasStatus: nextStatus } : {}),
    ...(processingStatus ? { processingStatus } : {}),
    ...(recordingStartedAt ? { recordingStartedAt } : {})
  }
}

function patchFromBaasCompleted(
  meeting: MeetingBotStateFields
): MeetingBaasStatusPatch | null {
  return patchFromBaasStatusChange(meeting, 'completed')
}

function patchFromBaasFailed(
  meeting: MeetingBotStateFields
): MeetingBaasStatusPatch | null {
  if (!shouldApplyBaasStatus(meeting.baasStatus, 'failed')) {
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
  canDispatchNewBot,
  getMeetingBotUiLabel,
  getMeetingBotUiPhase,
  isActiveMeetingBotUiPhase,
  mapBaasApiStatus,
  patchFromBaasCompleted,
  patchFromBaasFailed,
  patchFromBaasStatusChange
}
