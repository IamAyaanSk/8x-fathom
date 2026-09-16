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
import { buildMeetingAssistantInstructions } from './meeting-assistant-prompt.js'

type MeetingAssistantScope = 'single' | 'all'
type MeetingAssistantUIMessage = UIMessage<
  never,
  never,
  InferUITools<MeetingRagTools>
>

function createMeetingAssistantAgent({
  scope,
  meetingTitle,
  deps
}: {
  scope: MeetingAssistantScope
  meetingTitle: string
  deps: MeetingRagSearchDeps
}): ToolLoopAgent<never, MeetingRagTools> {
  const tools = createMeetingRagTools(deps)

  return new ToolLoopAgent({
    id: 'ask-8x-fathom',
    model: llmModel,
    instructions: buildMeetingAssistantInstructions({
      scope,
      meetingTitle
    }),
    tools,
    activeTools:
      scope === 'single' ? ['searchSingleMeetBase'] : ['searchAllMeetBase'],
    stopWhen: stepCountIs(5)
  })
}

export { createMeetingAssistantAgent }
export type { MeetingAssistantScope, MeetingAssistantUIMessage }
