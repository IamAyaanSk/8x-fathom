function formatRecordingDurationLabel(durationSec: number): string {
  const totalMinutes = Math.max(1, Math.round(durationSec / 60))
  return `${totalMinutes} min${totalMinutes === 1 ? '' : 's'}`
}

export { formatRecordingDurationLabel }
