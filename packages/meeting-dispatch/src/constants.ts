export const DISPATCH_BATCH_SIZE = 25
export const MEETING_BAAS_WEBHOOK_PATH = '/api/webhooks/meetingbaas'

const BAAS_STATUS_TO_PROCESS = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
  'completed',
  'failed'
] as const

type BaasStatusToProcess = (typeof BAAS_STATUS_TO_PROCESS)[number]

const MEETING_PROCESSING_STATUSES = [
  'idle',
  'importing',
  'pending',
  'processing',
  'ready',
  'failed'
] as const

type MeetingProcessingStatus = (typeof MEETING_PROCESSING_STATUSES)[number]

const BAAS_STATUS_RANK: Record<BaasStatusToProcess, number> = {
  joining: 1,
  in_waiting_room: 2,
  in_call_recording: 3,
  transcribing: 4,
  completed: 5,
  failed: 6
} as const

const BAAS_WEBHOOK_STATUS_TO_PROCESS = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'completed'
] as const
type BaasWebHookStatusToProcess =
  (typeof BAAS_WEBHOOK_STATUS_TO_PROCESS)[number]

const BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP: Record<
  string,
  BaasWebHookStatusToProcess
> = {
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  completed: 'completed'
} as const

const UI_MEET_STATUS = [
  'joining',
  'ready',
  'failed_processing',
  'failed_to_join',
  'starting_soon',
  'in_call_recording',
  'call_ended_processing',
  'transcribing',
  'in_waiting_room'
] as const
type UIMeetStatus = (typeof UI_MEET_STATUS)[number]

export {
  BAAS_STATUS_TO_PROCESS,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  BAAS_STATUS_RANK,
  type UIMeetStatus,
  type MeetingProcessingStatus,
  type BaasStatusToProcess
}
