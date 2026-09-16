import { getMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import {
  meetingTranscriptDurationSec,
  meetingTranscriptLinesFromJson,
  parseMeetingBaasOutputTranscriptionFromJson
} from '@repo/api-contract/meeting-baas-transcript'
import { isMeetingCaptureBotParticipant } from '@repo/api-contract/meeting-participants'
import type {
  GetMeetingDetailSuccessResponse,
  GetMeetingTranscriptSuccessResponse
} from '@repo/api-contract/v1/meeting-playback'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { getR2ObjectUtf8, presignR2GetObjectUrl } from '#src/r2-storage'
import { dateToIsoStringOrNull } from '#src/utils/date-to-iso'
import { HttpError } from '#src/v1/errors/http-error'

const RECORDING_PLAYBACK_PRESIGN_SECONDS = 3600

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

async function _loadRecordingPlayback(recordingR2Key: string | null) {
  if (!recordingR2Key) {
    return null
  }

  const expiresAt = new Date(
    Date.now() + RECORDING_PLAYBACK_PRESIGN_SECONDS * 1000
  )
  const url = await presignR2GetObjectUrl(
    recordingR2Key,
    RECORDING_PLAYBACK_PRESIGN_SECONDS
  )

  return {
    url,
    expiresAt: expiresAt.toISOString()
  }
}

function _calendarDurationSec(startTime: Date, endTime: Date): number | null {
  const calendarSeconds = Math.max(
    0,
    Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  )
  return calendarSeconds > 0 ? calendarSeconds : null
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
      recordingPlayback = await _loadRecordingPlayback(meeting.recordingR2Key)
    } catch {
      throw new HttpError(502, 'Failed to prepare recording playback')
    }

    const recordingDurationSec = _calendarDurationSec(
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
          .filter(
            (participant) =>
              !isMeetingCaptureBotParticipant({
                name: participant.name,
                displayName: participant.displayName
              })
          )
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
      throw new HttpError(409, 'Meeting transcript is not available yet')
    }

    let rawTranscript: string
    try {
      rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
    } catch {
      throw new HttpError(502, 'Failed to load meeting transcript')
    }

    let lines: ReturnType<typeof meetingTranscriptLinesFromJson>
    let durationSec: number | null = null
    try {
      lines = meetingTranscriptLinesFromJson(rawTranscript)
      const transcription =
        parseMeetingBaasOutputTranscriptionFromJson(rawTranscript)
      durationSec = meetingTranscriptDurationSec(transcription)
    } catch {
      throw new HttpError(502, 'Failed to parse meeting transcript')
    }

    res.json({
      success: true,
      message: 'Meeting transcript fetched successfully',
      data: {
        lines,
        durationSec
      }
    })
  } catch (error) {
    next(error)
  }
}

export { getMeetingDetailController, getMeetingTranscriptController }
