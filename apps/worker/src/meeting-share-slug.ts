import { randomBytes } from 'node:crypto'

function createMeetingShareSlug() {
  return randomBytes(16).toString('base64url')
}

function isShareSlugUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

export { createMeetingShareSlug, isShareSlugUniqueConstraintError }
