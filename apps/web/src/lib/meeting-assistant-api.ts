const LIBRARY_MEETING_ASSISTANT_API = '/api/v1/meetings/assistant'

function getMeetingAssistantApi(meetingId: string): string {
  return `/api/v1/meetings/${meetingId}/assistant`
}

export { getMeetingAssistantApi, LIBRARY_MEETING_ASSISTANT_API }
