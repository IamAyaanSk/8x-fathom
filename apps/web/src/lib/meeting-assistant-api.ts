import type { InferUITools, Tool, UIMessage } from 'ai'

const MEETING_ASSISTANT_API = '/api/v1/meetings/assistant'

type MeetingRagSearchInput = {
  query: string
  topK?: number
}

type MeetingRagSearchResult = {
  snippets: {
    meetingTitle: string
    startSec: number
    endSec: number
    speaker: string | null
    excerpt: string
  }[]
}

type MeetingAssistantTools = {
  searchAllMeetBase: Tool<MeetingRagSearchInput, MeetingRagSearchResult>
}

type MeetingAssistantUIMessage = UIMessage<
  never,
  never,
  InferUITools<MeetingAssistantTools>
>

export { MEETING_ASSISTANT_API, type MeetingAssistantUIMessage }
