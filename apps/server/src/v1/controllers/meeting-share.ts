import type {
  GetMeetingShareDetailSuccessResponse,
  GetMeetingShareTranscriptSuccessResponse,
  PostMeetingShareEnableSuccessResponse
} from '@repo/api-contract/v1/meeting-share'
import { calendarDurationSec } from '@repo/date'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { loadMeetingTranscriptData } from '#src/services/meeting-transcript'
import {
  createMeetingShareSlug,
  getMeetingPlaybackUrl,
  isParticipantBot
} from '#src/services/meeting/index'
import { HttpError } from '#src/v1/errors/http-error'

function _shareSlugFromRequest(req: Request): string | null {
  const shareSlug = req.params.shareSlug
  if (typeof shareSlug !== 'string' || shareSlug.length === 0) {
    return null
  }
  return shareSlug
}

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

const _sharedMeetingSelect = {
  title: true,
  startTime: true,
  endTime: true,
  processingStatus: true,
  summary: true,
  recordingR2Key: true,
  transcriptR2Key: true,
  highlights: {
    orderBy: { timestampSec: 'asc' as const },
    select: {
      id: true,
      timestampSec: true,
      endTimestampSec: true,
      note: true
    }
  },
  actionItems: {
    orderBy: [{ timestampSec: 'asc' as const }, { createdAt: 'asc' as const }],
    select: {
      id: true,
      text: true,
      timestampSec: true,
      completed: true
    }
  },
  participants: {
    orderBy: { name: 'asc' as const },
    select: {
      id: true,
      name: true,
      displayName: true,
      profilePicture: true
    }
  }
}

async function _loadReadySharedMeeting(shareSlug: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { shareSlug },
    select: _sharedMeetingSelect
  })

  if (!meeting || meeting.processingStatus !== 'ready') {
    throw new HttpError(404, 'Shared meeting not found')
  }

  return meeting
}

const getMeetingShareDetailController = async (
  req: Request,
  res: Response<GetMeetingShareDetailSuccessResponse>,
  next: NextFunction
) => {
  try {
    const shareSlug = _shareSlugFromRequest(req)
    if (!shareSlug) {
      throw new HttpError(400, 'Share slug is required')
    }

    const meeting = await _loadReadySharedMeeting(shareSlug)

    let recordingPlayback: { url: string; expiresAt: string } | null = null
    try {
      recordingPlayback = await getMeetingPlaybackUrl(meeting.recordingR2Key)
    } catch {
      throw new HttpError(502, 'Failed to prepare recording playback')
    }

    res.json({
      success: true,
      message: 'Shared meeting fetched successfully',
      data: {
        title: meeting.title,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        summary: meeting.summary,
        recordingDurationSec: calendarDurationSec(
          meeting.startTime,
          meeting.endTime
        ),
        recordingPlayback,
        highlights: meeting.highlights.map((highlight) => ({
          id: highlight.id,
          timestampSec: highlight.timestampSec,
          endTimestampSec: highlight.endTimestampSec,
          note: highlight.note
        })),
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
          }))
      }
    })
  } catch (error) {
    next(error)
  }
}

const getMeetingShareTranscriptController = async (
  req: Request,
  res: Response<GetMeetingShareTranscriptSuccessResponse>,
  next: NextFunction
) => {
  try {
    const shareSlug = _shareSlugFromRequest(req)
    if (!shareSlug) {
      throw new HttpError(400, 'Share slug is required')
    }

    const meeting = await _loadReadySharedMeeting(shareSlug)
    const transcript = await loadMeetingTranscriptData(meeting.transcriptR2Key)

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
  res: Response<PostMeetingShareEnableSuccessResponse>,
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
