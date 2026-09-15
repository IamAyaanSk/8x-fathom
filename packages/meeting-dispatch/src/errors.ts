class DispatchError extends Error {
  readonly statusCode: number
  readonly meetingId?: string

  constructor(statusCode: number, message: string, meetingId?: string) {
    super(message)
    this.name = 'DispatchError'
    this.statusCode = statusCode
    this.meetingId = meetingId
  }
}

export { DispatchError }
