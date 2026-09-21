class UnrecoverableTranscriptArtifactError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnrecoverableTranscriptArtifactError'
  }
}

export { UnrecoverableTranscriptArtifactError }
