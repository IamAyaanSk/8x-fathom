import { randomBytes } from 'node:crypto'

import { prisma } from '@repo/db'

const SHARE_SLUG_ATTEMPTS = 5

function createMeetingShareSlug() {
  return randomBytes(16).toString('base64url')
}

function _isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

async function ensureMeetingShareSlug(meetingId: string): Promise<string> {
  const existing = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { shareSlug: true }
  })
  if (existing?.shareSlug) {
    return existing.shareSlug
  }

  for (let attempt = 0; attempt < SHARE_SLUG_ATTEMPTS; attempt += 1) {
    const shareSlug = createMeetingShareSlug()
    try {
      const result = await prisma.meeting.updateMany({
        where: { id: meetingId, shareSlug: null },
        data: { shareSlug }
      })
      if (result.count === 0) {
        const current = await prisma.meeting.findUnique({
          where: { id: meetingId },
          select: { shareSlug: true }
        })
        if (current?.shareSlug) {
          return current.shareSlug
        }
        throw new Error('Meeting not found while assigning share slug')
      }
      return shareSlug
    } catch (error) {
      if (
        !_isUniqueConstraintError(error) ||
        attempt === SHARE_SLUG_ATTEMPTS - 1
      ) {
        throw error
      }
    }
  }

  throw new Error('Failed to assign a unique share slug')
}

export { createMeetingShareSlug, ensureMeetingShareSlug }
