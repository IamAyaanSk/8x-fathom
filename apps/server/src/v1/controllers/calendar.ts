import '#src/env'
import type {
  GetCalendarStatusSuccessResponse,
  PostCalendarSyncSuccessResponse
} from '@repo/api-contract/v1/calendar'

import '#src/types/express'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import {
  hasCalendarScope,
  setupCalendarWatch,
  syncCalendarEvents
} from '#src/services/google-calendar/index'

const getCalendarStatusController = async (
  req: Request,
  res: Response<GetCalendarStatusSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const account = await prisma.account.findFirst({
      where: {
        userId,
        providerId: 'google'
      },
      select: {
        id: true,
        userId: true,
        scope: true
      }
    })

    let connected

    if (!account) connected = false
    else connected = hasCalendarScope(account.scope)

    res.json({
      success: true,
      message: 'Calendar status fetched successfully',
      data: { connected }
    })
  } catch (error) {
    next(error)
  }
}

const postCalendarSyncController = async (
  req: Request,
  res: Response<PostCalendarSyncSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    await setupCalendarWatch(userId)
    const result = await syncCalendarEvents(userId)

    res.json({
      success: true,
      message: 'Calendar synced successfully',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export { getCalendarStatusController, postCalendarSyncController }
