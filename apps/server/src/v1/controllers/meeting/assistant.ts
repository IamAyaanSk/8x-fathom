import {
  createMeetingAssistantAgent,
  type MeetingAssistantContext
} from '@repo/ai'
import { postMeetingAssistantRequestBodySchema } from '@repo/api-contract/v1/meeting/assistant'
import { prisma } from '@repo/db'
import { pipeAgentUIStreamToResponse, validateUIMessages } from 'ai'
import type { NextFunction, Request, Response } from 'express'

import { searchMeetingTranscripts } from '#src/services/meeting/index'
import { HttpError } from '#src/v1/errors/http-error'

const postMeetingAssistantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const bodyResult = postMeetingAssistantRequestBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid assistant request')
    }

    const { messages, meetingId } = bodyResult.data

    let validatedMessages: unknown[]

    try {
      validatedMessages = await validateUIMessages({ messages })
    } catch {
      throw new HttpError(400, 'Invalid chat messages')
    }

    let context: MeetingAssistantContext = 'library'
    let meetingTitle = 'Your meeting library'

    if (meetingId) {
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

      context = 'meeting-detail'
      meetingTitle = meeting.title.trim() || 'Untitled meeting'
    } else {
      // Global chatbot, context should be more general
      // check we have any meetings or not

      const readyMeeting = await prisma.meeting.findFirst({
        where: {
          userId,
          processingStatus: 'ready',
          transcriptEmbeddingsExtractedAt: {
            not: null
          }
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

    const agent = createMeetingAssistantAgent({
      context,
      meetingTitle,
      deps: {
        searchAllMeetBase: ({ query }) =>
          searchMeetingTranscripts({ userId, query })
      }
    })

    const abortController = new AbortController()

    req.on('close', () => {
      abortController.abort()
    })

    await pipeAgentUIStreamToResponse({
      response: res,
      agent,
      uiMessages: validatedMessages,
      sendReasoning: false,
      abortSignal: abortController.signal
    })
  } catch (error) {
    next(error)
  }
}

export { postMeetingAssistantController }
