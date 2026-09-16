type MeetingParticipantLabelFields = {
  name: string
  displayName: string | null
}

function meetingParticipantLabel(
  participant: MeetingParticipantLabelFields
): string {
  const trimmedDisplay = participant.displayName?.trim()
  if (trimmedDisplay && trimmedDisplay.length > 0) {
    return trimmedDisplay
  }
  const trimmedName = participant.name.trim()
  return trimmedName.length > 0 ? trimmedName : 'Unknown'
}

function isMeetingCaptureBotParticipant(
  participant: MeetingParticipantLabelFields
): boolean {
  const label = meetingParticipantLabel(participant).toLowerCase()
  const raw =
    `${participant.name} ${participant.displayName ?? ''}`.toLowerCase()

  if (label.includes('notetaker') || raw.includes('notetaker')) {
    return true
  }
  if (raw.includes('meetingbaas') || raw.includes('meeting baas')) {
    return true
  }
  if (raw.includes('8x') && (raw.includes('bot') || raw.includes('recorder'))) {
    return true
  }

  return false
}

export { isMeetingCaptureBotParticipant, meetingParticipantLabel }
