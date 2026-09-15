import { getMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import type {
  GetMeetingsUpcomingSuccessResponse,
  PostMeetingCaptureResponse
} from '@repo/api-contract/v1/meetings'
import { prisma } from '@repo/db'
import {
  dispatchBotForMeeting,
  DispatchError,
  type DispatchResult
} from '@repo/meeting-dispatch'
import type { NextFunction, Request, Response } from 'express'

import '#src/env'
import '#src/types/express'
import { env } from '#src/env'
import { HttpError } from '#src/v1/errors/http-error'

function _dispatchCallbackParams() {
  return {
    meetingBaasApiKey: env.MEETINGBAAS_API_KEY,
    callbackBaseUrl: env.BASE_URL,
    webhookSecret: env.MEETINGBAAS_WEBHOOK_SECRET
  }
}

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

function _dispatchResponseData(
  dispatched: DispatchResult,
  processingStatus: 'idle' | 'pending' | 'processing' | 'ready' | 'failed'
) {
  return {
    meetingId: dispatched.meetingId,
    baasBotId: dispatched.baasBotId,
    baasStatus: dispatched.baasStatus,
    uiPhase: getMeetingBotUiPhase({
      baasBotId: dispatched.baasBotId,
      baasStatus: dispatched.baasStatus,
      recordingStartedAt: null,
      processingStatus
    })
  }
}

const getMeetingsUpcomingController = async (
  req: Request,
  res: Response<GetMeetingsUpcomingSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const now = new Date()

    const rows = await prisma.meeting.findMany({
      where: { userId, endTime: { gt: now } },
      orderBy: { startTime: 'asc' },
      select: {
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
          htmlLink: row.htmlLink,
          baasBotId: row.baasBotId,
          baasStatus: row.baasStatus,
          uiPhase: getMeetingBotUiPhase({
            baasBotId: row.baasBotId,
            baasStatus: row.baasStatus,
            recordingStartedAt: row.recordingStartedAt,
            processingStatus: row.processingStatus
          })
        }))
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
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      res.status(400).json({
        success: false,
        message: 'Meeting id is required'
      })
      return
    }

    let dispatched
    try {
      dispatched = await dispatchBotForMeeting({
        meetingId,
        userId,
        mode: 'capture',
        ..._dispatchCallbackParams()
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
      data: _dispatchResponseData(dispatched, 'idle')
    })
  } catch (error) {
    next(error)
  }
}

export { getMeetingsUpcomingController, postMeetingCaptureController }
