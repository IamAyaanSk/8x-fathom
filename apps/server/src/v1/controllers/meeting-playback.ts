import { getMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import type {
  GetMeetingDetailSuccessResponse,
  GetMeetingTranscriptSuccessResponse
} from '@repo/api-contract/v1/meeting-playback'
import { calendarDurationSec } from '@repo/date'
import { prisma } from '@repo/db'
import { getMeetingTranscriptData } from '@repo/meeting-dispatch'

import '#src/types/express'
import type { NextFunction, Request, Response } from 'express'

import { getR2ObjectUtf8 } from '#src/r2-storage'
import {
  getMeetingPlaybackUrl,
  isParticipantBot
} from '#src/services/meeting/index'
import { dateToIsoStringOrNull } from '#src/utils/date-to-iso'
import { HttpError } from '#src/v1/errors/http-error'

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

const getMeetingDetailController = async (
  req: Request,
  res: Response<GetMeetingDetailSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }

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

    const uiPhase = getMeetingBotUiPhase({
      baasBotId: meeting.baasBotId,
      baasStatus: meeting.baasStatus,
      processingStatus: meeting.processingStatus,
      recordingStartedAt: meeting.recordingStartedAt
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
        baasStatus: meeting.baasStatus,
        processingStatus: meeting.processingStatus,
        summary: meeting.summary,
        shareSlug: meeting.shareSlug,
        recordingDurationSec,
        recordingStartedAt: dateToIsoStringOrNull(meeting.recordingStartedAt),
        recordingPlayback,
        highlights: meeting.highlights.map((highlight) => ({
          id: highlight.id,
          timestampSec: highlight.timestampSec,
          endTimestampSec: highlight.endTimestampSec,
          note: highlight.note
        })),
        scratchpadEntries: meeting.scratchpadEntries.flatMap((entry) => {
          const updatedAt =
            dateToIsoStringOrNull(entry.updatedAt) ??
            dateToIsoStringOrNull(entry.createdAt)
          if (!updatedAt) {
            return []
          }
          return [
            {
              id: entry.id,
              timestampSec: entry.timestampSec,
              text: entry.text,
              updatedAt
            }
          ]
        }),
        actionItems: meeting.actionItems.map((item) => ({
          id: item.id,
          text: item.text,
          timestampSec: item.timestampSec,
          completed: item.completed
        })),
        participants: meeting.participants
          .filter((participant) => !isParticipantBot(participant.name))
          .map((participant) => ({
            id: participant.id,
            name: participant.name,
            displayName: participant.displayName,
            profilePicture: participant.profilePicture
          })),
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
  res: Response<GetMeetingTranscriptSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }

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
