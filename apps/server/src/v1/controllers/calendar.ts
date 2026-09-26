import '#src/env'
import type {
  GetCalendarStatusResponse,
  PostCalendarSyncResponse
} from '@repo/api-contract/v1/calendar'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import { isDemoUserEmail } from '#src/services/demo/index'
import {
  hasCalendarScope,
  setupCalendarWatch,
  syncCalendarEvents
} from '#src/services/google-calendar/index'

const getCalendarStatusController = async (
  req: Request,
  res: Response<GetCalendarStatusResponse>,
  next: NextFunction
) => {
  try {
    const userEmail = req.session!.user.email
    if (isDemoUserEmail(userEmail)) {
      res.json({
        success: true,
        message: 'Calendar status fetched successfully',
        data: { connected: false, lastSyncedAt: null }
      })
      return
    }

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

    let connected: boolean

    if (!account) connected = false
    else connected = hasCalendarScope(account.scope)

    let lastSyncedAt: string | null = null
    if (connected) {
      const watch = await prisma.calendarWatch.findUnique({
        where: { userId },
        select: { updatedAt: true }
      })
      const lastMeeting = await prisma.meeting.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      })
      const latest = watch?.updatedAt ?? lastMeeting?.updatedAt ?? null
      if (latest) {
        lastSyncedAt = latest.toISOString()
      }
    }

    res.json({
      success: true,
      message: 'Calendar status fetched successfully',
      data: { connected, lastSyncedAt }
    })
  } catch (error) {
    next(error)
  }
}

const postCalendarSyncController = async (
  req: Request,
  res: Response<PostCalendarSyncResponse>,
  next: NextFunction
) => {
  try {
    const userEmail = req.session!.user.email
    if (isDemoUserEmail(userEmail)) {
      res.json({
        success: true,
        message: 'Calendar sync is simulated in demo mode',
        data: {
          syncedCount: 0,
          lastSyncedAt: new Date().toISOString()
        }
      })
      return
    }

    const userId = req.session!.user.id
    await setupCalendarWatch(userId).catch(() => undefined)
    const result = await syncCalendarEvents(userId)

    res.json({
      success: true,
      message: 'Calendar synced successfully',
      data: {
        syncedCount: result.syncedCount,
        lastSyncedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    next(error)
  }
}

export { getCalendarStatusController, postCalendarSyncController }
