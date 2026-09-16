import {
  ToolLoopAgent,
  stepCountIs,
  type InferUITools,
  type UIMessage
} from 'ai'

import { llmModel } from '../model.js'
import {
  createMeetingRagTools,
  type MeetingRagSearchDeps,
  type MeetingRagTools
} from '../tools/meeting-rag-tools.js'
import {
  buildMeetingAssistantInstructions,
  type MeetingAssistantContext
} from './meeting-assistant-prompt.js'

type MeetingAssistantUIMessage = UIMessage<
  never,
  never,
  InferUITools<MeetingRagTools>
>

function createMeetingAssistantAgent({
  context,
  meetingTitle,
  deps
}: {
  context: MeetingAssistantContext
  meetingTitle: string
  deps: MeetingRagSearchDeps
}): ToolLoopAgent<never, MeetingRagTools> {
  const tools = createMeetingRagTools(deps)

  return new ToolLoopAgent({
    id: 'ask-8x-fathom',
    model: llmModel,
    instructions: buildMeetingAssistantInstructions({
      context,
      meetingTitle
    }),
    tools,
    activeTools: ['searchAllMeetBase'],
    stopWhen: stepCountIs(5)
  })
}

export { createMeetingAssistantAgent }
export type { MeetingAssistantContext, MeetingAssistantUIMessage }
