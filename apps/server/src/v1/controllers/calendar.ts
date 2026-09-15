import '#src/env'
import type {
  GetCalendarStatusSuccessResponse,
  PostCalendarSyncSuccessResponse
} from '@repo/api-contract/v1/calendar'

import '#src/types/express'
import { setupCalendarWatchAndSync } from '#src/services/calendar-sync'
import { isCalendarConnectedForUser } from '#src/services/google-account'
import type { NextFunction, Request, Response } from 'express'

const getCalendarStatusController = async (
  req: Request,
  res: Response<GetCalendarStatusSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const connected = await isCalendarConnectedForUser(userId)

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
    const result = await setupCalendarWatchAndSync(userId)

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
