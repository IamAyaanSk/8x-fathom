import { getMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import {
  patchMeetingHighlightBodySchema,
  postMeetingHighlightBodySchema,
  putMeetingScratchpadEntryBodySchema,
  type PatchMeetingHighlightSuccessResponse,
  type PostMeetingHighlightSuccessResponse,
  type PutMeetingScratchpadEntrySuccessResponse
} from '@repo/api-contract/v1/meeting-playback'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { HttpError } from '#src/v1/errors/http-error'

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

function _highlightIdFromRequest(req: Request): string | null {
  const highlightId = req.params.highlightId
  if (typeof highlightId !== 'string' || highlightId.length === 0) {
    return null
  }
  return highlightId
}

async function _loadOwnedMeetingForLiveCapture(userId: string, meetingId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, userId },
    select: {
      id: true,
      baasBotId: true,
      baasStatus: true,
      processingStatus: true,
      recordingStartedAt: true
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

  if (uiPhase !== 'in_call_recording') {
    throw new HttpError(409, 'Highlights and scratchpad are only available during a live recording')
  }

  return meeting
}

function _mapHighlight(highlight: {
  id: string
  timestampSec: number
  endTimestampSec: number | null
  note: string | null
}) {
  return {
    id: highlight.id,
    timestampSec: highlight.timestampSec,
    endTimestampSec: highlight.endTimestampSec,
    note: highlight.note
  }
}

const postMeetingHighlightController = async (
  req: Request,
  res: Response<PostMeetingHighlightSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }

    const bodyResult = postMeetingHighlightBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid highlight request')
    }

    const meeting = await _loadOwnedMeetingForLiveCapture(userId, meetingId)

    const openHighlight = await prisma.highlight.findFirst({
      where: { meetingId: meeting.id, endTimestampSec: null },
      select: { id: true }
    })

    if (openHighlight) {
      throw new HttpError(409, 'End the current highlight before starting a new one')
    }

    const created = await prisma.highlight.create({
      data: {
        meetingId: meeting.id,
        timestampSec: bodyResult.data.timestampSec
      },
      select: {
        id: true,
        timestampSec: true,
        endTimestampSec: true,
        note: true
      }
    })

    res.json({
      success: true,
      message: 'Highlight started',
      data: _mapHighlight(created)
    })
  } catch (error) {
    next(error)
  }
}

const patchMeetingHighlightController = async (
  req: Request,
  res: Response<PatchMeetingHighlightSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    const highlightId = _highlightIdFromRequest(req)

    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }
    if (!highlightId) {
      throw new HttpError(400, 'Highlight id is required')
    }

    const bodyResult = patchMeetingHighlightBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid highlight update')
    }

    const meeting = await _loadOwnedMeetingForLiveCapture(userId, meetingId)

    const existing = await prisma.highlight.findFirst({
      where: { id: highlightId, meetingId: meeting.id },
      select: {
        id: true,
        timestampSec: true,
        endTimestampSec: true,
        note: true
      }
    })

    if (!existing) {
      throw new HttpError(404, 'Highlight not found')
    }

    const endTimestampSec = bodyResult.data.endTimestampSec
    const noteUpdate = bodyResult.data.note

    if (existing.endTimestampSec != null) {
      if (endTimestampSec != null) {
        throw new HttpError(409, 'Highlight is already ended')
      }
      if (noteUpdate === undefined) {
        throw new HttpError(400, 'Nothing to update on this highlight')
      }
      const updated = await prisma.highlight.update({
        where: { id: existing.id },
        data: { note: noteUpdate },
        select: {
          id: true,
          timestampSec: true,
          endTimestampSec: true,
          note: true
        }
      })
      res.json({
        success: true,
        message: 'Highlight updated',
        data: _mapHighlight(updated)
      })
      return
    }

    if (endTimestampSec == null) {
      if (noteUpdate === undefined) {
        throw new HttpError(400, 'Nothing to update on this highlight')
      }
      const updated = await prisma.highlight.update({
        where: { id: existing.id },
        data: { note: noteUpdate },
        select: {
          id: true,
          timestampSec: true,
          endTimestampSec: true,
          note: true
        }
      })
      res.json({
        success: true,
        message: 'Highlight updated',
        data: _mapHighlight(updated)
      })
      return
    }

    if (endTimestampSec < existing.timestampSec) {
      throw new HttpError(400, 'Highlight end time must be after the start time')
    }

    const note =
      noteUpdate !== undefined ? noteUpdate : existing.note

    const updated = await prisma.highlight.update({
      where: { id: existing.id },
      data: {
        endTimestampSec,
        note
      },
      select: {
        id: true,
        timestampSec: true,
        endTimestampSec: true,
        note: true
      }
    })

    res.json({
      success: true,
      message: 'Highlight ended',
      data: _mapHighlight(updated)
    })
  } catch (error) {
    next(error)
  }
}

const putMeetingScratchpadEntryController = async (
  req: Request,
  res: Response<PutMeetingScratchpadEntrySuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }

    const bodyResult = putMeetingScratchpadEntryBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid scratchpad entry')
    }

    const meeting = await _loadOwnedMeetingForLiveCapture(userId, meetingId)

    const saved = await prisma.scratchpadEntry.upsert({
      where: {
        meetingId_timestampSec: {
          meetingId: meeting.id,
          timestampSec: bodyResult.data.timestampSec
        }
      },
      create: {
        meetingId: meeting.id,
        timestampSec: bodyResult.data.timestampSec,
        text: bodyResult.data.text
      },
      update: {
        text: bodyResult.data.text
      },
      select: {
        id: true,
        timestampSec: true,
        text: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      message: 'Scratchpad entry saved',
      data: {
        id: saved.id,
        timestampSec: saved.timestampSec,
        text: saved.text,
        updatedAt: saved.updatedAt.toISOString()
      }
    })
  } catch (error) {
    next(error)
  }
}

export {
  patchMeetingHighlightController,
  postMeetingHighlightController,
  putMeetingScratchpadEntryController
}
