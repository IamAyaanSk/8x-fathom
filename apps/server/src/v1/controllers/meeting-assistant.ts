import {
  createMeetingAssistantAgent,
  type MeetingAssistantContext
} from '@repo/ai'
import { postMeetingAssistantBodySchema } from '@repo/api-contract/v1/meeting-assistant'
import { prisma } from '@repo/db'
import { pipeAgentUIStreamToResponse, validateUIMessages } from 'ai'
import type { NextFunction, Request, Response } from 'express'

import { createMeetingRagSearchDeps } from '#src/services/meeting-transcript-vector-search'
import '#src/types/express'
import { HttpError } from '#src/v1/errors/http-error'

async function _assertUserHasSearchableMeetings(userId: string): Promise<void> {
  const readyMeeting = await prisma.meeting.findFirst({
    where: {
      userId,
      processingStatus: 'ready',
      transcriptEmbeddingsExtractedAt: { not: null }
    },
    select: { id: true }
  })

  if (!readyMeeting) {
    throw new HttpError(
      409,
      'No processed meetings are ready for questions yet'
    )
  }
}

async function _streamMeetingAssistant({
  req,
  res,
  userId,
  context,
  meetingTitle,
  rawMessages
}: {
  req: Request
  res: Response
  userId: string
  context: MeetingAssistantContext
  meetingTitle: string
  rawMessages: unknown[]
}): Promise<void> {
  let messages: unknown[]
  try {
    messages = await validateUIMessages({ messages: rawMessages })
  } catch {
    throw new HttpError(400, 'Invalid chat messages')
  }

  const agent = createMeetingAssistantAgent({
    context,
    meetingTitle,
    deps: createMeetingRagSearchDeps({ userId })
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
}

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

const postMeetingsLibraryAssistantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const bodyResult = postMeetingAssistantBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid assistant request')
    }

    await _assertUserHasSearchableMeetings(userId)

    await _streamMeetingAssistant({
      req,
      res,
      userId,
      context: 'library',
      meetingTitle: 'Your meeting library',
      rawMessages: bodyResult.data.messages
    })
  } catch (error) {
    next(error)
  }
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

    await _streamMeetingAssistant({
      req,
      res,
      userId,
      context: 'meeting-detail',
      meetingTitle: meeting.title.trim() || 'Untitled meeting',
      rawMessages: bodyResult.data.messages
    })
  } catch (error) {
    next(error)
  }
}

export {
  postMeetingAssistantController,
  postMeetingsLibraryAssistantController
}
