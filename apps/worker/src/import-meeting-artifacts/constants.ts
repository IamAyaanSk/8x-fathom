export const ARTIFACT_IMPORT_CRON_EXPRESSION = '*/15 * * * * *'
export const ARTIFACT_IMPORT_BATCH_SIZE = 4
export const ARTIFACT_IMPORT_TRANSACTION_TIMEOUT_MS = 30_000
export const ARTIFACT_IMPORT_LEASE_MS = 15 * 60 * 1000
export const ARTIFACT_IMPORT_RETRY_DELAY_MS = 15_000
export const ARTIFACT_IMPORT_FETCH_TIMEOUT_MS = 10 * 60 * 1000

function meetingRecordingR2Key(meetingId: string) {
  return `meetings/${meetingId}/recording.mp4`
}

function meetingTranscriptR2Key(meetingId: string) {
  return `meetings/${meetingId}/transcription.json`
}

function meetingChatMessagesR2Key(meetingId: string) {
  return `meetings/${meetingId}/chat-messages.json`
}

export {
  meetingChatMessagesR2Key,
  meetingRecordingR2Key,
  meetingTranscriptR2Key
}
