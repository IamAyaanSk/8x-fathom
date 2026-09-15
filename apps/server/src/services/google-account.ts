import { prisma } from '@repo/db'

import { hasCalendarScope } from '#src/services/calendar-scope'

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

async function getGoogleAccessTokenForUser(userId: string): Promise<string> {
  const account = await getGoogleAccountForUser(userId)
  if (!account) {
    throw new Error('Google account is not linked')
  }

  if (!hasCalendarScope(account.scope)) {
    throw new Error('Google Calendar scope is not granted')
  }

  const { auth } = await import('#src/auth')

  const tokenResult = await auth.api.getAccessToken({
    body: {
      accountId: account.id,
      userId
    }
  })

  if (!tokenResult.accessToken) {
    throw new Error('Could not retrieve Google access token')
  }

  return tokenResult.accessToken
}

export {
  getGoogleAccessTokenForUser,
  getGoogleAccountForUser,
  isCalendarConnectedForUser
}
