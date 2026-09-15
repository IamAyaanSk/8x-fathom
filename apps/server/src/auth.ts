import { prisma } from '@repo/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

import { env } from '#src/env'

const auth = betterAuth({
  appName: '8x Fathom',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.WEB_ORIGIN],
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
  }
})

type AppSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export { auth }
export type { AppSession }
