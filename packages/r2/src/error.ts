class R2UploadError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'R2UploadError'
    this.statusCode = statusCode
  }
}

export { R2UploadError }
