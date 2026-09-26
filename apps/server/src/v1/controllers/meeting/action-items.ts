import {
  patchMeetingActionItemsRequestParamsSchema,
  patchMeetingActionItemRequestBodySchema,
  type PatchMeetingActionItemResponse
} from '@repo/api-contract/v1/meeting/action-items'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import { isDemoUserEmail } from '#src/services/demo/index'
import { HttpError } from '#src/v1/errors/http-error'

const patchMeetingActionItemController = async (
  req: Request,
  res: Response<PatchMeetingActionItemResponse>,
  next: NextFunction
) => {
  try {
    const userEmail = req.session!.user.email
    if (isDemoUserEmail(userEmail)) {
      throw new HttpError(403, 'Action item updates are disabled in demo mode')
    }

    const userId = req.session!.user.id

    const validatedRequestParams =
      patchMeetingActionItemsRequestParamsSchema.safeParse(req.params)

    if (!validatedRequestParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { meetingId, actionItemId } = validatedRequestParams.data

    const bodyResult = patchMeetingActionItemRequestBodySchema.safeParse(
      req.body
    )

    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid action item update')
    }

    const existing = await prisma.actionItem.findFirst({
      where: {
        id: actionItemId,
        meeting: { id: meetingId, userId }
      },
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
