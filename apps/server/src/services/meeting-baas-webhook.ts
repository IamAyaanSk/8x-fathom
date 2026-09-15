import type { IncomingHttpHeaders } from 'node:http'

import {
  mapBaasApiStatus,
  patchFromBaasFailed,
  patchFromBaasStatusChange,
  type BaasBotStatus,
  type MeetingProcessingStatus
} from '@repo/api-contract/baas-bot-status'
import type { MeetingBaasWebhookEvent } from '@repo/api-contract/meeting-baas-webhook'
import { prisma } from '@repo/db'
import { Webhook, WebhookVerificationError } from 'svix'

import { env } from '#src/env'

function _headerValue(
  headers: IncomingHttpHeaders,
  name: string
): string | undefined {
  const value = headers[name]
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function verifyMeetingBaasWebhook(
  headers: IncomingHttpHeaders,
  rawBody: string
): unknown | null {
  const svixId = _headerValue(headers, 'svix-id')
  const svixTimestamp = _headerValue(headers, 'svix-timestamp')
  const svixSignature = _headerValue(headers, 'svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    return null
  }

  if (rawBody.length === 0) {
    return null
  }

  try {
    new Webhook(env.MEETINGBAAS_WEBHOOK_SECRET).verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    })

    return JSON.parse(rawBody) as unknown
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return null
    }
    if (error instanceof SyntaxError) {
      return null
    }
    throw error
  }
}

async function _findMeetingForWebhook(params: {
  botId: string
  meetingId?: string
}) {
  const byBotId = await prisma.meeting.findFirst({
    where: { baasBotId: params.botId },
    select: {
      id: true,
      baasBotId: true,
      baasStatus: true,
      recordingStartedAt: true,
      processingStatus: true
    }
  })
  if (byBotId) {
    return byBotId
  }

  if (!params.meetingId) {
    return null
  }

  const byExtraId = await prisma.meeting.findFirst({
    where: { id: params.meetingId },
    select: {
      id: true,
      baasBotId: true,
      baasStatus: true,
      recordingStartedAt: true,
      processingStatus: true
    }
  })
  if (!byExtraId) {
    return null
  }
  if (byExtraId.baasBotId && byExtraId.baasBotId !== params.botId) {
    return null
  }
  return byExtraId
}

function _r2KeyFromSignedUrl(
  value: string | null | undefined
): string | undefined {
  if (!value) {
    return undefined
  }

  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(value).pathname)
  } catch {
    return undefined
  }

  const withoutSlash = pathname.startsWith('/') ? pathname.slice(1) : pathname
  if (withoutSlash.length === 0) {
    return undefined
  }

  const bucketPrefix = `${env.R2_BUCKET}/`
  if (withoutSlash.startsWith(bucketPrefix)) {
    const key = withoutSlash.slice(bucketPrefix.length)
    return key.length > 0 ? key : undefined
  }

  return withoutSlash
}

function _meetingBotState(meeting: {
  baasBotId: string | null
  baasStatus: BaasBotStatus | null
  recordingStartedAt: Date | null
  processingStatus: MeetingProcessingStatus
}) {
  return {
    baasBotId: meeting.baasBotId,
    baasStatus: meeting.baasStatus,
    recordingStartedAt: meeting.recordingStartedAt,
    processingStatus: meeting.processingStatus
  }
}

async function applyMeetingBaasWebhook(event: MeetingBaasWebhookEvent) {
  const botId = event.data.bot_id
  const extraMeetingId = event.extra?.meetingId
  const meeting = await _findMeetingForWebhook({
    botId,
    meetingId: extraMeetingId
  })
  if (!meeting) {
    return
  }

  const state = _meetingBotState(meeting)

  if (event.event === 'bot.status_change') {
    if (!mapBaasApiStatus(event.data.status.code)) {
      console.warn(
        `Ignored unknown MeetingBaas status code: ${event.data.status.code}`
      )
      return
    }

    const patch = patchFromBaasStatusChange(
      state,
      event.data.status.code,
      event.data.status.start_time
    )
    if (!patch) {
      return
    }

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: patch
    })
    return
  }

  if (event.event === 'bot.completed') {
    if (meeting.baasStatus === 'failed') {
      return
    }

    const recordingR2Key = _r2KeyFromSignedUrl(event.data.video)
    const transcriptR2Key = _r2KeyFromSignedUrl(event.data.transcription)
    const chatMessagesR2Key = _r2KeyFromSignedUrl(event.data.chat_messages)
    const participants = event.data.participants

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        baasStatus: 'completed',
        processingStatus: 'pending',
        ...(recordingR2Key ? { recordingR2Key } : {}),
        ...(transcriptR2Key ? { transcriptR2Key } : {}),
        ...(chatMessagesR2Key ? { chatMessagesR2Key } : {}),
        ...(participants
          ? {
              participants: {
                create: participants.map((participant) => ({
                  name: participant.name,
                  baasUserId: participant.id,
                  displayName: participant.display_name,
                  profilePicture: participant.profile_picture
                }))
              }
            }
          : {})
      }
    })
    return
  }

  const patch = patchFromBaasFailed(state)
  if (!patch) {
    return
  }
  await prisma.meeting.update({
    where: { id: meeting.id },
    data: patch
  })
}

export { applyMeetingBaasWebhook, verifyMeetingBaasWebhook }
