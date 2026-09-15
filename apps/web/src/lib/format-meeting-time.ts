function formatMeetingStartTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

export { formatMeetingStartTime }
