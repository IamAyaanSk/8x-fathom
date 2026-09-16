function getRecordingElapsedSec(
  recordingStartedAt: string | null,
  nowMs: number
): number {
  if (!recordingStartedAt) {
    return 0
  }
  const startedMs = Date.parse(recordingStartedAt)
  if (!Number.isFinite(startedMs)) {
    return 0
  }
  return Math.max(0, Math.floor((nowMs - startedMs) / 1000))
}

export { getRecordingElapsedSec }
