import { generateMeetingSummary } from '@repo/ai'
import {
  postMeetingSummaryGenerateBodySchema,
  type PostMeetingSummaryGenerateSuccessResponse
} from '@repo/api-contract/v1/meetings'
import { prisma } from '@repo/db'
import { formatMeetingBaasTranscriptForAgent } from '@repo/meeting-dispatch'

import '#src/types/express'
import type { NextFunction, Request, Response } from 'express'

import { getR2ObjectUtf8 } from '#src/r2-storage'
import { HttpError } from '#src/v1/errors/http-error'

function _meetingIdFromRequest(req: Request): string | null {
  const meetingId = req.params.meetingId
  if (typeof meetingId !== 'string' || meetingId.length === 0) {
    return null
  }
  return meetingId
}

const postMeetingSummaryGenerateController = async (
  req: Request,
  res: Response<PostMeetingSummaryGenerateSuccessResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.session!.user.id
    const meetingId = _meetingIdFromRequest(req)
    if (!meetingId) {
      throw new HttpError(400, 'Meeting id is required')
    }

    const bodyResult = postMeetingSummaryGenerateBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      throw new HttpError(400, 'Invalid summary generation request')
    }

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      select: {
        id: true,
        title: true,
        transcriptR2Key: true
      }
    })

    if (!meeting) {
      throw new HttpError(404, 'Meeting not found')
    }

    if (!meeting.transcriptR2Key) {
      throw new HttpError(409, 'Meeting transcript is not available yet')
    }

    let transcript: string
    try {
      const rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
      transcript = formatMeetingBaasTranscriptForAgent(rawTranscript)
    } catch {
      throw new HttpError(502, 'Failed to load meeting transcript')
    }

    const { template, detail } = bodyResult.data

    let summary: string
    try {
      const result = await generateMeetingSummary({
        transcript,
        meetingTitle: meeting.title,
        template,
        additionalDirections: detail
      })
      summary = result.summary
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'Transcript is empty'
          ? 'Meeting transcript is empty'
          : 'Summary generation failed'
      throw new HttpError(502, message)
    }

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { summary }
    })

    res.json({
      success: true,
      message: 'Meeting summary generated successfully',
      data: { summary }
    })
  } catch (error) {
    next(error)
  }
}

export { postMeetingSummaryGenerateController }
