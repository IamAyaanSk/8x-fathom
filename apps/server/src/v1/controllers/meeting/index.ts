import {
  postMeetingCaptureRequestParamsSchema,
  type GetMeetingsCompletedResponse,
  type GetMeetingsLiveResponse,
  type GetMeetingsUpcomingResponse,
  type PostMeetingCaptureResponse
} from '@repo/api-contract/v1/meeting/index'
import { type Prisma, prisma } from '@repo/db'
import { dispatchBotForMeeting, DispatchError } from '@repo/meeting-dispatch'
import { calendarDurationSec } from '@repo/shared-utils/date'
import { getMeetingUiStatus } from '@repo/shared-utils/meeting'
import type { MeetingListItem } from '@repo/shared-validations/meeting'
import type { NextFunction, Request, Response } from 'express'

import '#src/env'
import '#src/types/express'
import { env } from '#src/env'
import { HttpError } from '#src/v1/errors/http-error'

const _meetingListSelect = {
  id: true,
  title: true,
  startTime: true,
  endTime: true,
  meetingUrl: true,
  htmlLink: true,
  baasBotId: true,
  baasStatus: true,
  recordingStartedAt: true,
  processingStatus: true
} as const

type MeetingListRow = Prisma.MeetingGetPayload<{
  select: typeof _meetingListSelect
}>

function _toMeetingListItem(
  row: MeetingListRow,
  recordingDurationSec?: number | null
): MeetingListItem {
  return {
    id: row.id,
    title: row.title,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    meetingUrl: row.meetingUrl,

    // TODO: Remove this from FE
    baasBotId: row.baasBotId,
    baasStatus: row.baasStatus,
    htmlLink: row.htmlLink,

    uiPhase: getMeetingUiStatus({
      baasStatus: row.baasStatus,
      processingStatus: row.processingStatus
    }),
    recordingDurationSec: recordingDurationSec ?? null
  }
}

const getMeetingsUpcomingController = async (
  req: Request,
  res: Response<GetMeetingsUpcomingResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const now = new Date()

    const rows = await prisma.meeting.findMany({
      where: {
        userId,
        OR: [
          { baasStatus: null },
          {
            baasStatus: {
              notIn: ['in_call_recording', 'completed', 'transcribing']
            }
          }
        ],
        endTime: { gt: now }
      },
      orderBy: { startTime: 'asc' },
      select: _meetingListSelect
    })

    res.json({
      success: true,
      message: 'Upcoming meetings fetched successfully',
      data: {
        meetings: rows.map(_toMeetingListItem)
      }
    })
  } catch (error) {
    next(error)
  }
}

const getMeetingsLiveController = async (
  req: Request,
  res: Response<GetMeetingsLiveResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const rows = await prisma.meeting.findMany({
      where: {
        userId,
        baasStatus: 'in_call_recording'
      },
      orderBy: { startTime: 'asc' },
      select: _meetingListSelect
    })

    res.json({
      success: true,
      message: 'Live meetings fetched successfully',
      data: {
        meetings: rows.map(_toMeetingListItem)
      }
    })
  } catch (error) {
    next(error)
  }
}

const getMeetingsCompletedController = async (
  req: Request,
  res: Response<GetMeetingsCompletedResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const now = new Date()

    const rows = await prisma.meeting.findMany({
      where: {
        userId,
        baasStatus: { not: 'in_call_recording' },
        OR: [
          { endTime: { lte: now } },
          { baasStatus: { in: ['completed', 'transcribing'] } }
        ]
      },
      orderBy: { startTime: 'desc' },
      select: _meetingListSelect
    })

    const meetings = rows.map((row) =>
      _toMeetingListItem(row, calendarDurationSec(row.startTime, row.endTime))
    )

    res.json({
      success: true,
      message: 'Past meetings fetched successfully',
      data: {
        meetings
      }
    })
  } catch (error) {
    next(error)
  }
}

const postMeetingCaptureController = async (
  req: Request,
  res: Response<PostMeetingCaptureResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams = postMeetingCaptureRequestParamsSchema.safeParse(
      req.params
    )
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { meetingId } = validatedParams.data

    let dispatched
    try {
      dispatched = await dispatchBotForMeeting({
        meetingId,
        userId,
        mode: 'capture',
        meetingBaasApiKey: env.MEETINGBAAS_API_KEY,
        callbackBaseUrl: env.BASE_URL,
        webhookSecret: env.MEETINGBAAS_WEBHOOK_SECRET,
        transcriptionApiKey: env.DEEPGRAM_API_KEY
      })
    } catch (error) {
      if (error instanceof DispatchError) {
        throw new HttpError(error.statusCode, error.message)
      }
      throw error
    }

    res.json({
      success: true,
      message: 'Bot dispatched successfully',
      data: {
        meetingId: dispatched.meetingId,
        baasBotId: dispatched.baasBotId,
        baasStatus: dispatched.baasStatus,
        uiPhase: getMeetingUiStatus({
          baasStatus: dispatched.baasStatus,
          processingStatus: 'idle'
        })
      }
    })
  } catch (error) {
    next(error)
  }
}

export {
  getMeetingsCompletedController,
  getMeetingsLiveController,
  getMeetingsUpcomingController,
  postMeetingCaptureController
}
