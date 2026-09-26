import { generateMeetingSummary } from '@repo/ai'
import {
  postMeetingSummaryGenerateRequestBodySchema,
  postMeetingSummaryGenerateRequestParamsSchema,
  type PostMeetingSummaryGenerateResponse
} from '@repo/api-contract/v1/meeting/summary'
import { prisma } from '@repo/db'
import { formatMeetingBaasTranscriptForAgent } from '@repo/shared-utils/meeting'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import { getR2ObjectUtf8 } from '#src/r2-storage'
import { isDemoUserEmail } from '#src/services/demo/index'
import { HttpError } from '#src/v1/errors/http-error'

const postMeetingSummaryGenerateController = async (
  req: Request,
  res: Response<PostMeetingSummaryGenerateResponse>,
  next: NextFunction
) => {
  try {
    const userEmail = req.session!.user.email
    if (isDemoUserEmail(userEmail)) {
      throw new HttpError(403, 'Summary generation is disabled in demo mode')
    }

    const userId = req.session!.user.id

    const validatedParams =
      postMeetingSummaryGenerateRequestParamsSchema.safeParse(req.params)
    if (!validatedParams.success) {
      throw new HttpError(400, 'Invalid request parameters')
    }

    const { meetingId } = validatedParams.data

    const bodyResult = postMeetingSummaryGenerateRequestBodySchema.safeParse(
      req.body
    )
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

    const { summary } = await generateMeetingSummary({
      transcript,
      meetingTitle: meeting.title,
      template,
      additionalDirections: detail
    })

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
