import { prisma } from '@repo/db'

import { hasCalendarScope } from '#src/services/google-calendar/index'

type GoogleAccountRecord = {
  id: string
  userId: string
  scope: string | null
}

async function getGoogleAccountForUser(
  userId: string
): Promise<GoogleAccountRecord | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'google'
    },
    select: {
      id: true,
      userId: true,
      scope: true
    }
  })

  return account
}

async function isCalendarConnectedForUser(userId: string): Promise<boolean> {
  const account = await getGoogleAccountForUser(userId)
  if (!account) {
    return false
  }

  return hasCalendarScope(account.scope)
}

export { getGoogleAccountForUser, isCalendarConnectedForUser }
