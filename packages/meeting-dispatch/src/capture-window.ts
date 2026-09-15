const MEETING_CAPTURE_LEAD_MS = 120_000

function _parseStartMs(startTimeIso: string): number | null {
  const startMs = Date.parse(startTimeIso)
  if (Number.isNaN(startMs)) {
    return null
  }
  return startMs
}

function isInBotJoiningSoonWindow(
  startTimeIso: string,
  nowMs = Date.now()
): boolean {
  const startMs = _parseStartMs(startTimeIso)
  if (startMs == null) {
    return false
  }
  return nowMs >= startMs - MEETING_CAPTURE_LEAD_MS && nowMs < startMs
}


function isManualCaptureAllowed(
  startTimeIso: string,
  nowMs = Date.now()
): boolean {
  const startMs = _parseStartMs(startTimeIso)
  if (startMs == null) {
    return false
  }
  return (
    nowMs < startMs - MEETING_CAPTURE_LEAD_MS || nowMs >= startMs
  )
}

export {
  MEETING_CAPTURE_LEAD_MS,
  isInBotJoiningSoonWindow,
  isManualCaptureAllowed
}
