import {
  patchMeetingHighlightRequestBodySchema,
  patchMeetingHighlightRequestParamsSchema,
  type PatchMeetingHighlightResponse,
  postMeetingHighlightRequestBodySchema,
  postMeetingHighlightRequestParamsSchema,
  type PostMeetingHighlightResponse
} from '@repo/api-contract/v1/meeting/highlights'
import { prisma } from '@repo/db'
import { getMeetingUiStatus } from '@repo/shared-utils/meeting'
import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '#src/v1/errors/http-error'

function _mapHighlight(highlight: {
  id: string
  timestampSec: number
  endTimestampSec: number | null
  note: string | null
}) {
  return {
    id: highlight.id,
    timestampSec: highlight.timestampSec,
    endTimestampSec: highlight.endTimestampSec,
    note: highlight.note
  }
}

const postMeetingHighlightController = async (
  req: Request,
  res: Response<PostMeetingHighlightResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams = postMeetingHighlightRequestParamsSchema.safeParse(
      req.params
    )
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const bodyResult = postMeetingHighlightRequestBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid highlight request')
    }

    const { meetingId } = validatedParams.data

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId
      },
      select: {
        baasStatus: true,
        processingStatus: true,
        highlights: {
          where: {
            endTimestampSec: null
          },
          select: {
            id: true
          }
        }
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    if (meeting.highlights.length > 0) {
      throw new HttpError(
        409,
        'End the current highlight before starting a new one'
      )
    }

    const uiPhase = getMeetingUiStatus({
      baasStatus: meeting.baasStatus,
      processingStatus: meeting.processingStatus
    })

    if (uiPhase !== 'in_call_recording') {
      throw new HttpError(
        409,
        'Highlights are only available during a live recording'
      )
    }

    const created = await prisma.highlight.create({
      data: {
        meetingId: meetingId,
        timestampSec: bodyResult.data.timestampSec
      },
      select: {
        id: true,
        timestampSec: true,
        endTimestampSec: true,
        note: true
      }
    })

    res.json({
      success: true,
      message: 'Highlight started',
      data: _mapHighlight(created)
    })
  } catch (error) {
    next(error)
  }
}

const patchMeetingHighlightController = async (
  req: Request,
  res: Response<PatchMeetingHighlightResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams = patchMeetingHighlightRequestParamsSchema.safeParse(
      req.params
    )
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const bodyResult = patchMeetingHighlightRequestBodySchema.safeParse(
      req.body
    )
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid highlight update')
    }

    const { meetingId, highlightId } = validatedParams.data
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId
      },
      select: {
        highlights: {
          where: {
            id: highlightId,
            endTimestampSec: null
          },
          select: {
            id: true,
            timestampSec: true,
            endTimestampSec: true,
            note: true
          }
        }
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    const existing = meeting.highlights[0]
    if (!existing) {
      throw new HttpError(404, 'Highlight not found')
    }

    const { endTimestampSec, note: noteUpdate } = bodyResult.data

    if (endTimestampSec < existing.timestampSec) {
      throw new HttpError(
        400,
        'Highlight end time must be after the start time'
      )
    }

    const updated = await prisma.highlight.update({
      where: { id: existing.id },
      data: { endTimestampSec, note: noteUpdate },
      select: {
        id: true,
        timestampSec: true,
        endTimestampSec: true,
        note: true
      }
    })

    res.json({
      success: true,
      message: 'Highlight updated',
      data: _mapHighlight(updated)
    })
    return
  } catch (error) {
    next(error)
  }
}

export { patchMeetingHighlightController, postMeetingHighlightController }
