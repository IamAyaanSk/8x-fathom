import { getMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import { prisma } from '@repo/db'

import { createMeetingBaasClient } from './meeting-baas-client.js'

async function cancelJoiningBotForDeletedCalendarEvent(params: {
  userId: string
  googleEventId: string
  meetingBaasApiKey: string
}): Promise<boolean> {
  const meeting = await prisma.meeting.findFirst({
    where: {
      userId: params.userId,
      googleEventId: params.googleEventId
    },
    select: {
      id: true,
      baasBotId: true,
      baasStatus: true
    }
  })

  if (!meeting) {
    return false
  }

  const uiPhase = getMeetingBotUiPhase({
    baasBotId: meeting.baasBotId,
    baasStatus: meeting.baasStatus
  })

  if (uiPhase !== 'joining' || !meeting.baasBotId) {
    return false
  }

  const client = createMeetingBaasClient(params.meetingBaasApiKey)
  const leaveResult = await client.leaveBot({ bot_id: meeting.baasBotId })
  if (!leaveResult.success) {
    console.warn(
      `MeetingBaas leaveBot failed for meeting ${meeting.id}: ${leaveResult.message || leaveResult.error}`
    )
  }

  await prisma.meeting.delete({ where: { id: meeting.id } })
  return true
}

export { cancelJoiningBotForDeletedCalendarEvent }
