import {
  mapBaasApiStatus,
  patchFromBaasStatusChange,
  TERMINAL_BAAS_STATUSES
} from '@repo/api-contract/baas-bot-status'
import { prisma } from '@repo/db'
import { createMeetingBaasClient } from '@repo/meeting-dispatch'

import { env } from '#src/env'

const STATUS_POLL_BATCH_SIZE = 25

async function runActiveBotStatusSync() {
  const now = new Date()
  const meetings = await prisma.meeting.findMany({
    where: {
      baasBotId: { not: null },
      endTime: { gt: now },
      OR: [
        { baasStatus: null },
        { baasStatus: { notIn: TERMINAL_BAAS_STATUSES } }
      ]
    },
    select: {
      id: true,
      baasBotId: true,
      baasStatus: true,
      recordingStartedAt: true,
      processingStatus: true
    },
    take: STATUS_POLL_BATCH_SIZE,
    orderBy: { startTime: 'asc' }
  })

  if (meetings.length === 0) {
    return { checkedCount: 0, updatedCount: 0 }
  }

  const client = createMeetingBaasClient(env.MEETINGBAAS_API_KEY)
  let updatedCount = 0

  for (const meeting of meetings) {
    const botId = meeting.baasBotId
    if (!botId) {
      continue
    }

    const statusResult = await client.getBotStatus({ bot_id: botId })
    if (!statusResult.success) {
      console.error(
        `Bot status poll failed for ${meeting.id}: ${statusResult.message || statusResult.error}`
      )
      continue
    }

    const nextStatus = mapBaasApiStatus(statusResult.data.status)
    if (!nextStatus) {
      console.error(
        `Unknown bot status for ${meeting.id}: ${statusResult.data.status}`
      )
      continue
    }

    const patch = patchFromBaasStatusChange(
      {
        baasBotId: meeting.baasBotId,
        baasStatus: meeting.baasStatus,
        recordingStartedAt: meeting.recordingStartedAt,
        processingStatus: meeting.processingStatus
      },
      statusResult.data.status
    )
    if (!patch) {
      continue
    }

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: patch
    })
    updatedCount += 1
  }

  return { checkedCount: meetings.length, updatedCount }
}

export { runActiveBotStatusSync }
