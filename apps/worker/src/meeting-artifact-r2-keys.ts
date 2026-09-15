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
