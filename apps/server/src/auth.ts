import { prisma } from '@repo/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

import { calendarPlugin } from '#src/auth/plugins/calendar'
import { env } from '#src/env'
import { CALENDAR_WEBHOOK_PATH } from '#src/services/calendar-constants'

const auth = betterAuth({
  appName: '8x Fathom',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.WEB_ORIGIN],
  advanced: {    
    disableOriginCheck: [CALENDAR_WEBHOOK_PATH] as unknown as boolean
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: 'offline',
      prompt: 'select_account consent'
    }
  },
  plugins: [calendarPlugin()]
})

type AppSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export { auth }
export type { AppSession }
