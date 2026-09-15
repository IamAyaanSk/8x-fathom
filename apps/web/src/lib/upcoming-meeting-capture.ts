import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { isMeetingCaptureWindowOpen } from '@repo/meeting-dispatch/capture-window'

const CAPTURE_HINT = 'Use this to start capture now for this meet.'
const CAPTURE_EARLY_HINT = 'Capture opens 2 minutes before the call starts.'
const CAPTURE_STARTED_LABEL = 'Capture started'

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
  const hasBot = meeting.baasBotId != null
  const withinCaptureWindow = isMeetingCaptureWindowOpen(
    meeting.startTime,
    nowMs
  )
  const hasEnded = Date.parse(meeting.endTime) <= nowMs
  const canCapture = !hasBot && withinCaptureWindow && !hasEnded && !isCapturing

  if (hasBot) {
    return {
      canCapture: false,
      tooltip: CAPTURE_STARTED_LABEL,
      ariaLabel: CAPTURE_STARTED_LABEL
    }
  }

  if (!withinCaptureWindow) {
    return {
      canCapture: false,
      tooltip: CAPTURE_EARLY_HINT,
      ariaLabel: CAPTURE_EARLY_HINT
    }
  }

  return {
    canCapture,
    tooltip: CAPTURE_HINT,
    ariaLabel: CAPTURE_HINT
  }
}

export { getUpcomingMeetingCaptureUi }
