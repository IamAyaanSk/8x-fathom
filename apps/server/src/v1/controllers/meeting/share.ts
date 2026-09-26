import {
  getMeetingShareDetailRequestParamsSchema,
  getMeetingShareTranscriptRequestParamsSchema,
  postMeetingShareEnableRequestParamsSchema,
  type GetMeetingShareDetailResponse,
  type GetMeetingShareTranscriptResponse,
  type PostMeetingShareEnableResponse
} from '@repo/api-contract/v1/meeting/share'
import { prisma } from '@repo/db'
import { calendarDurationSec } from '@repo/shared-utils/date'
import {
  getMeetingTranscriptData,
  isParticipantBot
} from '@repo/shared-utils/meeting'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { getR2ObjectUtf8 } from '#src/r2-storage'
import {
  createMeetingShareSlug,
  getMeetingPlaybackUrl
} from '#src/services/meeting/index'
import { HttpError } from '#src/v1/errors/http-error'

const getMeetingShareDetailController = async (
  req: Request,
  res: Response<GetMeetingShareDetailResponse>,
  next: NextFunction
) => {
  try {
    const validatedParams = getMeetingShareDetailRequestParamsSchema.safeParse(
      req.params
    )
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { shareSlug } = validatedParams.data

    const meeting = await prisma.meeting.findUnique({
      where: { shareSlug, processingStatus: 'ready' },
      select: {
        title: true,
        startTime: true,
        endTime: true,
        processingStatus: true,
        summary: true,
        recordingR2Key: true,
        transcriptR2Key: true,
        highlights: {
          orderBy: { timestampSec: 'asc' },
          select: {
            id: true,
            timestampSec: true,
            endTimestampSec: true,
            note: true
          }
        },
        actionItems: {
          orderBy: [{ timestampSec: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            text: true,
            timestampSec: true,
            completed: true
          }
        },
        participants: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            displayName: true,
            profilePicture: true
          }
        },
        transcriptChunks: {
          select: { endSec: true },
          orderBy: { endSec: 'desc' },
          take: 1
        }
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Shared meeting not found')
    }

    let recordingPlayback: { url: string; expiresAt: string } | null = null
    try {
      recordingPlayback = await getMeetingPlaybackUrl(meeting.recordingR2Key)
    } catch {
      throw new HttpError(502, 'Failed to prepare recording playback')
    }

    const lastChunkEndSec = meeting.transcriptChunks?.[0]?.endSec
    const recordingDurationSec =
      lastChunkEndSec && lastChunkEndSec > 0
        ? lastChunkEndSec
        : calendarDurationSec(meeting.startTime, meeting.endTime)

    res.json({
      success: true,
      message: 'Shared meeting fetched successfully',
      data: {
        title: meeting.title,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        summary: meeting.summary,
        recordingDurationSec,
        recordingPlayback,
        highlights: meeting.highlights,
        actionItems: meeting.actionItems,
        participants: meeting.participants.filter(
          (participant) => !isParticipantBot(participant.name)
        )
      }
    })
  } catch (error) {
    next(error)
  }
}

const getMeetingShareTranscriptController = async (
  req: Request,
  res: Response<GetMeetingShareTranscriptResponse>,
  next: NextFunction
) => {
  try {
    const validatedParams =
      getMeetingShareTranscriptRequestParamsSchema.safeParse(req.params)
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { shareSlug } = validatedParams.data

    const meeting = await prisma.meeting.findUnique({
      where: { shareSlug, processingStatus: 'ready' },
      select: {
        transcriptR2Key: true
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Shared meeting not found')
    }

    if (!meeting.transcriptR2Key) {
      throw new HttpError(404, 'Meeting transcript not found')
    }

    const rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
    const transcript = getMeetingTranscriptData(rawTranscript)

    res.json({
      success: true,
      message: 'Shared meeting transcript fetched successfully',
      data: transcript
    })
  } catch (error) {
    next(error)
  }
}

const postMeetingShareEnableController = async (
  req: Request,
  res: Response<PostMeetingShareEnableResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams = postMeetingShareEnableRequestParamsSchema.safeParse(
      req.params
    )
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { meetingId } = validatedParams.data

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      select: {
        processingStatus: true,
        shareSlug: true
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    if (meeting.processingStatus !== 'ready') {
      throw new HttpError(409, 'Meeting is not ready to share')
    }

    let shareSlug = meeting.shareSlug
    if (!shareSlug) {
      shareSlug = createMeetingShareSlug()

      await prisma.meeting.update({
        where: {
          id: meetingId
        },
        data: {
          shareSlug
        }
      })
    }

    res.json({
      success: true,
      message: 'Share link ready',
      data: { shareSlug }
    })
  } catch (error) {
    next(error)
  }
}

export {
  getMeetingShareDetailController,
  getMeetingShareTranscriptController,
  postMeetingShareEnableController
}
