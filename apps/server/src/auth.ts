import { prisma } from '@repo/db'
import { isProductionEnvironment } from '@repo/env'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

import { calendarPlugin } from '#src/auth/plugins/calendar'
import { env } from '#src/env'
import { CALENDAR_WEBHOOK_PATH } from '#src/services/google-calendar/constants'

const webOriginHost = new URL(env.WEB_ORIGIN).host

const authBaseURL = isProductionEnvironment(env.NODE_ENV)
  ? {
      allowedHosts: [webOriginHost, '*.vercel.app'],
      protocol: 'https' as const,
      fallback: env.BETTER_AUTH_URL
    }
  : env.BETTER_AUTH_URL

const auth = betterAuth({
  appName: '8x Fathom',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: authBaseURL,
  trustedOrigins: [env.WEB_ORIGIN],
  account: {
    skipStateCookieCheck: true
  },
  advanced: {
    trustedProxyHeaders: true,
    useSecureCookies: isProductionEnvironment(env.NODE_ENV),
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
