import '#src/env'
import type { GetMeetingsUpcomingSuccessResponse } from '@repo/api-contract/v1/meetings'
import { prisma } from '@repo/db'

import '#src/types/express'
import type { NextFunction, Request, Response } from 'express'

const getMeetingsUpcomingController = async (
  req: Request,
  res: Response<GetMeetingsUpcomingSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const now = new Date()

    const rows = await prisma.meeting.findMany({
      where: { userId, endTime: { gte: now } },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        meetingUrl: true,
        htmlLink: true
      }
    })

    res.json({
      success: true,
      message: 'Upcoming meetings fetched successfully',
      data: {
        meetings: rows.map((row) => ({
          id: row.id,
          title: row.title,
          startTime: row.startTime.toISOString(),
          endTime: row.endTime.toISOString(),
          meetingUrl: row.meetingUrl,
          htmlLink: row.htmlLink
        }))
      }
    })
  } catch (error) {
    next(error)
  }
}

export { getMeetingsUpcomingController }
