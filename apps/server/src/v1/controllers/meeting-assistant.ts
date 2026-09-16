import { createMeetingAssistantAgent } from '@repo/ai'
import { postMeetingAssistantBodySchema } from '@repo/api-contract/v1/meeting-assistant'
import { prisma } from '@repo/db'
import { pipeAgentUIStreamToResponse, validateUIMessages } from 'ai'
import type { NextFunction, Request, Response } from 'express'

import { createMeetingRagSearchDeps } from '#src/services/meeting-transcript-vector-search'
import '#src/types/express'
import { HttpError } from '#src/v1/errors/http-error'

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

const postMeetingAssistantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }

    const bodyResult = postMeetingAssistantBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid assistant request')
    }

    const { scope, messages: rawMessages } = bodyResult.data

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      select: {
        id: true,
        title: true,
        processingStatus: true,
        transcriptEmbeddingsExtractedAt: true
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    if (
      meeting.processingStatus !== 'ready' ||
      meeting.transcriptEmbeddingsExtractedAt === null
    ) {
      throw new HttpError(
        409,
        'Meeting transcripts are not ready for questions yet'
      )
    }

    let messages: unknown[]
    try {
      messages = await validateUIMessages({ messages: rawMessages })
    } catch {
      throw new HttpError(400, 'Invalid chat messages')
    }

    const agent = createMeetingAssistantAgent({
      scope,
      meetingTitle: meeting.title.trim() || 'Untitled meeting',
      deps: createMeetingRagSearchDeps({ userId, meetingId })
    })

    const abortController = new AbortController()
    req.on('close', () => {
      abortController.abort()
    })

    await pipeAgentUIStreamToResponse({
      response: res,
      agent,
      uiMessages: messages,
      sendReasoning: false,
      abortSignal: abortController.signal
    })
  } catch (error) {
    next(error)
  }
}

export { postMeetingAssistantController }
