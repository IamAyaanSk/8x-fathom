function dateToIsoStringOrNull(value: Date | null | undefined): string | null {
  if (value == null) {
    return null
  }
  const ms = value.getTime()
  if (!Number.isFinite(ms)) {
    return null
  }
  return value.toISOString()
}

export { dateToIsoStringOrNull }
