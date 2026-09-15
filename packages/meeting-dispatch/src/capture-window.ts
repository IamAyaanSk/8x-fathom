const MEETING_CAPTURE_LEAD_MS = 120_000

function isMeetingCaptureWindowOpen(
  startTimeIso: string,
  nowMs = Date.now()
): boolean {
  const startMs = Date.parse(startTimeIso)
  if (Number.isNaN(startMs)) {
    return false
  }
  return nowMs >= startMs - MEETING_CAPTURE_LEAD_MS
}

export { MEETING_CAPTURE_LEAD_MS, isMeetingCaptureWindowOpen }
