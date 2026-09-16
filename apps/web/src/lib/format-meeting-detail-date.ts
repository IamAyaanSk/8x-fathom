function formatMeetingDetailDate(startTimeIso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(startTimeIso))
}

export { formatMeetingDetailDate }
