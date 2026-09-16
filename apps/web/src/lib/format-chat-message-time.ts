function formatChatMessageTime(sentAtIso: string): string {
  const date = new Date(sentAtIso)
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export { formatChatMessageTime }
