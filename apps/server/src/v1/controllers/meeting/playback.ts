import {
  meetingRequestParamsSchema,
  type GetMeetingDetailResponse,
  type GetMeetingTranscriptResponse
} from '@repo/api-contract/v1/meeting/playback'
import { prisma } from '@repo/db'
import {
  getMeetingTranscriptData,
  getMeetingUiStatus,
  isParticipantBot
} from '@repo/shared-utils/meeting'
import { calendarDurationSec } from '@repo/shared-utils/date'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { getR2ObjectUtf8 } from '#src/r2-storage'
import { getMeetingPlaybackUrl } from '#src/services/meeting/index'
import { HttpError } from '#src/v1/errors/http-error'

const getMeetingDetailController = async (
  req: Request,
  res: Response<GetMeetingDetailResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams = meetingRequestParamsSchema.safeParse(req.params)
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { meetingId } = validatedParams.data

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        htmlLink: true,
        baasBotId: true,
        baasStatus: true,
        processingStatus: true,
        recordingStartedAt: true,
        summary: true,
        shareSlug: true,
        recordingR2Key: true,
        highlights: {
          orderBy: { timestampSec: 'asc' },
          select: {
            id: true,
            timestampSec: true,
            endTimestampSec: true,
            note: true
          }
        },
        scratchpadEntries: {
          orderBy: { timestampSec: 'asc' },
          select: {
            id: true,
            timestampSec: true,
            text: true,
            createdAt: true,
            updatedAt: true
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
        chatMessages: {
          orderBy: { sentAt: 'asc' },
          select: {
            id: true,
            senderName: true,
            text: true,
            sentAt: true
          }
        }
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    const uiPhase = getMeetingUiStatus({
      baasStatus: meeting.baasStatus,
      processingStatus: meeting.processingStatus
    })

    let recordingPlayback: { url: string; expiresAt: string } | null = null
    try {
      recordingPlayback = await getMeetingPlaybackUrl(meeting.recordingR2Key)
    } catch {
      throw new HttpError(502, 'Failed to prepare recording playback')
    }

    const recordingDurationSec = calendarDurationSec(
      meeting.startTime,
      meeting.endTime
    )

    res.json({
      success: true,
      message: 'Meeting detail fetched successfully',
      data: {
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        htmlLink: meeting.htmlLink,
        uiPhase,
        // TODO: Remove them from FE in future
        baasStatus: meeting.baasStatus,
        processingStatus: meeting.processingStatus,

        summary: meeting.summary,
        shareSlug: meeting.shareSlug,
        recordingDurationSec,
        recordingStartedAt: meeting.recordingStartedAt?.toISOString() ?? null,
        recordingPlayback,
        highlights: meeting.highlights,
        scratchpadEntries: meeting.scratchpadEntries.map((entry) => ({
          id: entry.id,
          timestampSec: entry.timestampSec,
          text: entry.text,
          updatedAt: entry.updatedAt.toISOString()
        })),
        actionItems: meeting.actionItems,
        participants: meeting.participants.filter(
          (participant) => !isParticipantBot(participant.name)
        ),
        chatMessages: meeting.chatMessages.map((message) => ({
          id: message.id,
          senderName: message.senderName,
          text: message.text,
          sentAt: message.sentAt.toISOString()
        }))
      }
    })
  } catch (error) {
    next(error)
  }
}

const getMeetingTranscriptController = async (
  req: Request,
  res: Response<GetMeetingTranscriptResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id

    const validatedParams = meetingRequestParamsSchema.safeParse(req.params)
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { meetingId } = validatedParams.data

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      select: {
        transcriptR2Key: true
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    if (!meeting.transcriptR2Key) {
      throw new HttpError(404, 'Meeting transcript not found')
    }

    const rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
    const transcript = getMeetingTranscriptData(rawTranscript)

    res.json({
      success: true,
      message: 'Meeting transcript fetched successfully',
      data: transcript
    })
  } catch (error) {
    next(error)
  }
}

export { getMeetingDetailController, getMeetingTranscriptController }
