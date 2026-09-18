import '#src/types/express'
import {
  meetingBaasWebhookEventSchema,
  meetingBaasWebhookHeadersSchema
} from '@repo/api-contract/meeting-baas-webhook'
import { prisma } from '@repo/db'
import {
  getBaasStatusRank,
  mapWebhookStatusToProcessStatus
} from '@repo/meeting-dispatch'
import type { NextFunction, Request, Response } from 'express'
import { Webhook } from 'svix'

import { env } from '#src/env'
import { isParticipantBot } from '#src/services/meeting/index'
import { HttpError } from '#src/v1/errors/http-error'

const postMeetingBaasWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawBody = req.rawBody
    if (!rawBody) {
      throw new HttpError(401, 'Unauthorized')
    }

    const headersResult = meetingBaasWebhookHeadersSchema.safeParse(req.headers)
    if (!headersResult.success) {
      throw new HttpError(401, 'Unauthorized')
    }

    try {
      new Webhook(env.MEETINGBAAS_WEBHOOK_SECRET).verify(
        rawBody,
        headersResult.data
      )
    } catch {
      throw new HttpError(401, 'Unauthorized')
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      throw new HttpError(400, 'Invalid JSON payload')
    }

    const parsed = meetingBaasWebhookEventSchema.safeParse(payload)
    if (!parsed.success) {
      res.status(200).json({ success: true, message: 'Ignored' })
      return
    }

    const event = parsed.data
    const { bot_id: botId } = event.data
    const meetingId = event.extra?.meetingId

    const meeting = await prisma.meeting.findFirst({
      where: {
        baasBotId: botId,
        id: meetingId
      },
      select: {
        id: true,
        baasBotId: true,
        baasStatus: true,
        recordingStartedAt: true,
        processingStatus: true,
        baasSignedArtifactUrls: true
      }
    })

    if (!meeting) {
      res.status(200).json({ success: true, message: 'Ignored' })
      return
    }

    if (event.event === 'bot.status_change') {
      // ok update bot status
      const webhookBotStatus = mapWebhookStatusToProcessStatus(
        event.data.status.code
      )

      if (!webhookBotStatus) {
        // Ignore no need to process these status
        res.status(200).json({ success: true, message: 'OK' })
        return
      }

      if (webhookBotStatus === 'completed') {
        // ok we are transcribing now
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            baasStatus: 'transcribing'
          }
        })
        res.status(200).json({ success: true, message: 'OK' })
        return
      }

      if (webhookBotStatus !== 'joining') {
        if (!meeting.baasStatus) {
          // This is impossible state for us
          // TODO: notify error reporting service
          res.status(200).json({ success: true, message: 'OK' })
          return
        }

        if (
          getBaasStatusRank(webhookBotStatus) <=
          getBaasStatusRank(meeting.baasStatus)
        ) {
          // Ignore older status update
          res.status(200).json({ success: true, message: 'OK' })
          return
        }
      }

      let baasRecordingStartedAt: Date | undefined

      if (webhookBotStatus === 'in_call_recording') {
        if (event.data.status.start_time) {
          baasRecordingStartedAt = new Date(event.data.status.start_time)
        } else {
          // Fallback to when we received this webhook
          baasRecordingStartedAt = new Date()
        }
      }

      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          baasStatus: webhookBotStatus,
          recordingStartedAt: baasRecordingStartedAt
        }
      })

      res.status(200).json({ success: true, message: 'OK' })
      return
    }

    if (event.event === 'bot.completed') {
      if (meeting.baasStatus === 'failed') {
        res.status(200).json({ success: true, message: 'Ignored' })
        return
      }

      if (meeting.processingStatus !== 'idle') {
        res.status(200).json({ success: true, message: 'Ignored' })
        return
      }

      const participants =
        event.data.participants?.filter(
          (participant) => !isParticipantBot(participant.name)
        ) ?? []

      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          baasStatus: 'completed',
          processingStatus: 'importing',
          baasSignedArtifactUrls: {
            video: event.data.video,
            transcription: event.data.transcription,
            rawTranscription: event.data.raw_transcription,
            audio: event.data.audio,
            chatMessages: event.data.chat_messages
          },

          participants: {
            create: participants.map((p) => ({
              name: p.name,
              baasUserId: p.id,
              displayName: p.display_name,
              profilePicture: p.profile_picture
            }))
          }
        }
      })
      res.status(200).json({ success: true, message: 'OK' })
      return
    }

    if (event.event === 'bot.failed') {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          baasStatus: 'failed',
          processingStatus: 'failed'
        }
      })

      res.status(200).json({ success: true, message: 'OK' })
      return
    }

    res.status(200).json({ success: true, message: 'OK' })
  } catch (error) {
    next(error)
  }
}

export { postMeetingBaasWebhookController }
