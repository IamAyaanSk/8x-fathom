import {
  isBaasBotStatus,
  isTerminalBaasStatus,
  parseBaasApiStatus,
  type BaasBotStatus
} from '@repo/api-contract/baas-bot-status'
import type { MeetingBaasWebhookEvent } from '@repo/api-contract/meeting-baas-webhook'
import { prisma } from '@repo/db'
import type { IncomingHttpHeaders } from 'node:http'
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
    console.log(rawBody.length)
    return null
  }

  try {
    new Webhook(env.MEETINGBAAS_WEBHOOK_SECRET).verify(
      rawBody,
      {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
      }
    )

    console.log(JSON.parse(rawBody))
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

function _shouldApplyBaasStatus(
  current: BaasBotStatus | null,
  next: BaasBotStatus
): boolean {
  if (current === next) {
    return false
  }
  if (current === 'completed') {
    return false
  }
  if (isTerminalBaasStatus(current) && !isTerminalBaasStatus(next)) {
    return false
  }
  return true
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
      recordingStartedAt: true
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
      recordingStartedAt: true
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

function _failedBaasStatus(errorCode: string | undefined): BaasBotStatus {
  if (errorCode && isBaasBotStatus(errorCode)) {
    return errorCode
  }
  return 'failed'
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

  if (event.event === 'bot.status_change') {
    let nextStatus: BaasBotStatus
    try {
      nextStatus = parseBaasApiStatus(event.data.status.code)
    } catch {
      console.warn(
        `Ignored unknown MeetingBaas status code: ${event.data.status.code}`
      )
      return
    }

    if (!_shouldApplyBaasStatus(meeting.baasStatus, nextStatus)) {
      return
    }

    const recordingStartedAt =
      nextStatus === 'in_call_recording' &&
      event.data.status.start_time != null
        ? new Date(event.data.status.start_time * 1000)
        : undefined

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        baasStatus: nextStatus,
        ...(recordingStartedAt && !meeting.recordingStartedAt
          ? { recordingStartedAt }
          : {})
      }
    })
    return
  }

  if (event.event === 'bot.completed') {
    if (!_shouldApplyBaasStatus(meeting.baasStatus, 'completed')) {
      return
    }
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { baasStatus: 'completed', processingStatus: 'pending' }
    })
    return
  }

  const nextStatus = _failedBaasStatus(event.data.error_code)
  if (!_shouldApplyBaasStatus(meeting.baasStatus, nextStatus)) {
    return
  }
  await prisma.meeting.update({
    where: { id: meeting.id },
    data: { baasStatus: nextStatus }
  })
}

export { applyMeetingBaasWebhook, verifyMeetingBaasWebhook }
