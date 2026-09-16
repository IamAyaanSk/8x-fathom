import {
  patchMeetingActionItemBodySchema,
  type PatchMeetingActionItemSuccessResponse
} from '@repo/api-contract/v1/meeting-playback'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { HttpError } from '#src/v1/errors/http-error'

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

function _actionItemIdFromRequest(req: Request): string | null {
  const actionItemId = req.params.actionItemId
  if (typeof actionItemId !== 'string' || actionItemId.length === 0) {
    return null
  }
  return actionItemId
}

const patchMeetingActionItemController = async (
  req: Request,
  res: Response<PatchMeetingActionItemSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    const actionItemId = _actionItemIdFromRequest(req)

    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }
    if (!actionItemId) {
      throw new HttpError(400, 'Action item id is required')
    }

    const bodyResult = patchMeetingActionItemBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid action item update')
    }

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      select: { id: true }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    const existing = await prisma.actionItem.findFirst({
      where: { id: actionItemId, meetingId: meeting.id },
      select: { id: true }
    })

    if (!existing) {
      throw new HttpError(404, 'Action item not found')
    }

    const updated = await prisma.actionItem.update({
      where: { id: existing.id },
      data: { completed: bodyResult.data.completed },
      select: {
        id: true,
        text: true,
        timestampSec: true,
        completed: true
      }
    })

    res.json({
      success: true,
      message: 'Action item updated successfully',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export { patchMeetingActionItemController }
