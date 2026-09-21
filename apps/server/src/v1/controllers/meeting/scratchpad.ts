import {
  putMeetingScratchpadEntryRequestBodySchema,
  putMeetingScratchpadEntryRequestParamsSchema,
  type PutMeetingScratchpadEntryResponse
} from '@repo/api-contract/v1/meeting/scratchpad'
import { prisma } from '@repo/db'
import { getMeetingUiStatus } from '@repo/shared-utils/meeting'
import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '#src/v1/errors/http-error'

const putMeetingScratchpadEntryController = async (
  req: Request,
  res: Response<PutMeetingScratchpadEntryResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams =
      putMeetingScratchpadEntryRequestParamsSchema.safeParse(req.params)
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const bodyResult = putMeetingScratchpadEntryRequestBodySchema.safeParse(
      req.body
    )
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid scratchpad entry')
    }

    const { meetingId } = validatedParams.data
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId
      },
      select: {
        id: true,
        baasStatus: true,
        processingStatus: true
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    const uiStatus = getMeetingUiStatus({
      baasStatus: meeting.baasStatus,
      processingStatus: meeting.processingStatus
    })

    if (uiStatus !== 'in_call_recording') {
      throw new HttpError(
        409,
        'Scratchpad entries are only available during a live recording'
      )
    }

    const saved = await prisma.scratchpadEntry.upsert({
      where: {
        meetingId_timestampSec: {
          meetingId: meeting.id,
          timestampSec: bodyResult.data.timestampSec
        }
      },
      create: {
        meetingId: meeting.id,
        timestampSec: bodyResult.data.timestampSec,
        text: bodyResult.data.text
      },
      update: {
        text: bodyResult.data.text
      },
      select: {
        id: true,
        timestampSec: true,
        text: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      message: 'Scratchpad entry saved',
      data: {
        id: saved.id,
        timestampSec: saved.timestampSec,
        text: saved.text,
        updatedAt: saved.updatedAt.toISOString()
      }
    })
  } catch (error) {
    next(error)
  }
}

export { putMeetingScratchpadEntryController }
