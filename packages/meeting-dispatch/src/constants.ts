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

export type BaasStatusToProcess = (typeof BAAS_STATUS_TO_PROCESS)[number]
export type BaasWebHookStatusToProcess =
  (typeof BAAS_WEBHOOK_STATUS_TO_PROCESS)[number]

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

const BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP: Record<
  string,
  BaasWebHookStatusToProcess
> = {
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  completed: 'completed'
} as const

export {
  BAAS_STATUS_TO_PROCESS,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  BAAS_STATUS_RANK
}
