import { prisma } from '@repo/db'

import { auth } from '#src/auth'
import { hasCalendarScope } from '#src/services/google-calendar/index'

async function getGoogleAccessTokenForUser(userId: string): Promise<string> {
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

  if (!account) {
    throw new Error('Google account is not linked')
  }

  if (!hasCalendarScope(account.scope)) {
    throw new Error('Google Calendar scope is not granted')
  }

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

export { getGoogleAccessTokenForUser }
