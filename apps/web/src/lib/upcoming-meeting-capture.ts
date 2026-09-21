import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import {
  isInBotJoiningSoonWindow,
  isManualCaptureAllowed,
  isMeetingEnded
} from '@repo/shared-utils/meeting'

const CAPTURE_HINT =
  'Use this to start capture now for this meet by sending bot.'
const CAPTURE_BOT_JOINING_SOON_HINT = 'The bot will be joining the meet soon.'
const CAPTURE_STARTED_LABEL = 'Capture started'
const RETRY_HINT = 'Send a new bot to this call.'

type UpcomingMeetingCaptureUi = {
  canCapture: boolean
  tooltip: string
  ariaLabel: string
}

function getUpcomingMeetingCaptureUi({
  meeting,
  nowMs,
  isCapturing
}: {
  meeting: MeetingListItem
  nowMs: number
  isCapturing: boolean
}): UpcomingMeetingCaptureUi {
  const failedJoin = meeting.uiPhase === 'failed_to_join'
  const hasBot = meeting.baasBotId != null
  const botJoiningSoon = isInBotJoiningSoonWindow(meeting.startTime, nowMs)
  const manualCaptureAllowed = isManualCaptureAllowed(meeting.startTime, nowMs)
  const hasEnded = isMeetingEnded(meeting.endTime, nowMs)
  const canCapture =
    (failedJoin || !hasBot) &&
    meeting.uiPhase !== 'failed_processing' &&
    (failedJoin || manualCaptureAllowed) &&
    !hasEnded &&
    !isCapturing

  if (failedJoin) {
    return {
      canCapture,
      tooltip: RETRY_HINT,
      ariaLabel: RETRY_HINT
    }
  }

  if (hasBot) {
    return {
      canCapture: false,
      tooltip: CAPTURE_STARTED_LABEL,
      ariaLabel: CAPTURE_STARTED_LABEL
    }
  }

  if (botJoiningSoon) {
    return {
      canCapture: false,
      tooltip: CAPTURE_BOT_JOINING_SOON_HINT,
      ariaLabel: CAPTURE_BOT_JOINING_SOON_HINT
    }
  }

  return {
    canCapture,
    tooltip: CAPTURE_HINT,
    ariaLabel: CAPTURE_HINT
  }
}

export { getUpcomingMeetingCaptureUi }
