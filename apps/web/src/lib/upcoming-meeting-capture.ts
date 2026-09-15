import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { isFailedMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import {
  isInBotJoiningSoonWindow,
  isManualCaptureAllowed,
  isMeetingEnded
} from '@repo/meeting-dispatch/capture-window'

const CAPTURE_HINT =
  'Use this to start capture now for this meet by sending bot.'
const CAPTURE_BOT_JOINING_SOON_HINT =
  'The bot will be joining the meet soon.'
const CAPTURE_STARTED_LABEL = 'Capture started'
const RETRY_HINT = 'Send a new bot to this call.'

type UpcomingMeetingCaptureUi = {
  canCapture: boolean
  canRetry: boolean
  tooltip: string
  ariaLabel: string
}

function getUpcomingMeetingCaptureUi({
  meeting,
  nowMs,
  isCapturing,
  isRetrying
}: {
  meeting: MeetingListItem
  nowMs: number
  isCapturing: boolean
  isRetrying: boolean
}): UpcomingMeetingCaptureUi {
  const failed = isFailedMeetingBotUiPhase(meeting.uiPhase)
  const hasBot = meeting.baasBotId != null
  const botJoiningSoon = isInBotJoiningSoonWindow(meeting.startTime, nowMs)
  const manualCaptureAllowed = isManualCaptureAllowed(
    meeting.startTime,
    nowMs
  )
  const hasEnded = isMeetingEnded(meeting.endTime, nowMs)
  const canRetry = failed && !hasEnded && !isRetrying
  const canCapture =
    !failed && !hasBot && manualCaptureAllowed && !hasEnded && !isCapturing

  if (failed) {
    return {
      canCapture: false,
      canRetry,
      tooltip: RETRY_HINT,
      ariaLabel: RETRY_HINT
    }
  }

  if (hasBot) {
    return {
      canCapture: false,
      canRetry: false,
      tooltip: CAPTURE_STARTED_LABEL,
      ariaLabel: CAPTURE_STARTED_LABEL
    }
  }

  if (botJoiningSoon) {
    return {
      canCapture: false,
      canRetry: false,
      tooltip: CAPTURE_BOT_JOINING_SOON_HINT,
      ariaLabel: CAPTURE_BOT_JOINING_SOON_HINT
    }
  }

  return {
    canCapture,
    canRetry: false,
    tooltip: CAPTURE_HINT,
    ariaLabel: CAPTURE_HINT
  }
}

export { getUpcomingMeetingCaptureUi }
