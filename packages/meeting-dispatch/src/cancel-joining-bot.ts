import { prisma } from '@repo/db'

import { getMeetingUiStatus } from '@repo/shared-utils/meeting'
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

  const uiPhase = getMeetingUiStatus({
    baasStatus: meeting.baasStatus,
    processingStatus: 'idle'
  })

  if (
    (uiPhase !== 'joining' && uiPhase !== 'in_waiting_room') ||
    !meeting.baasBotId
  ) {
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
