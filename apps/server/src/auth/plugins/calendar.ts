import { prisma } from '@repo/db'
import type { BetterAuthPlugin } from 'better-auth'
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware
} from 'better-auth/api'

import { CALENDAR_WEBHOOK_PATH } from '#src/services/google-calendar/constants'
import { syncCalendarEvents } from '#src/services/google-calendar/index'
import { setupCalendarWatch } from '#src/services/google-calendar/index'
import { hasCalendarScope } from '#src/services/google-calendar/index'

const GOOGLE_CHANNEL_ID_HEADER = 'x-goog-channel-id'
const GOOGLE_RESOURCE_ID_HEADER = 'x-goog-resource-id'
const GOOGLE_CHANNEL_TOKEN_HEADER = 'x-goog-channel-token'
const GOOGLE_RESOURCE_STATE_HEADER = 'x-goog-resource-state'

function calendarPlugin(): BetterAuthPlugin {
  return {
    id: 'fathom-calendar',
    endpoints: {
      calendarWebhook: createAuthEndpoint(
        CALENDAR_WEBHOOK_PATH,
        {
          method: 'POST'
        },
        async (ctx) => {
          const channelId = ctx.request?.headers.get(GOOGLE_CHANNEL_ID_HEADER)
          const resourceId = ctx.request?.headers.get(GOOGLE_RESOURCE_ID_HEADER)
          const channelToken = ctx.request?.headers.get(
            GOOGLE_CHANNEL_TOKEN_HEADER
          )
          const resourceState = ctx.request?.headers.get(
            GOOGLE_RESOURCE_STATE_HEADER
          )

          if (!channelId || !resourceId || !channelToken) {
            throw APIError.fromStatus('NOT_FOUND', {
              message: 'Unknown calendar channel'
            })
          }

          const watch = await prisma.calendarWatch.findFirst({
            where: { channelId },
            select: {
              resourceId: true,
              channelToken: true,
              userId: true
            }
          })

          if (!watch) {
            throw APIError.fromStatus('NOT_FOUND', {
              message: 'Unknown calendar channel'
            })
          }

          if (watch.resourceId !== resourceId) {
            throw APIError.fromStatus('UNAUTHORIZED', {
              message: 'Invalid calendar channel'
            })
          }

          if (watch.channelToken !== channelToken) {
            throw APIError.fromStatus('UNAUTHORIZED', {
              message: 'Invalid calendar channel token'
            })
          }

          if (resourceState === 'sync' || resourceState === 'exists') {
            void syncCalendarEvents(watch.userId)
          }

          return ctx.json({ ok: true })
        }
      )
    },
    hooks: {
      after: [
        {
          matcher: (context) => context.path === '/callback/:id',
          handler: createAuthMiddleware(async (ctx) => {
            const session = ctx.context.session ?? ctx.context.newSession
            if (!session) {
              return
            }

            const account = await prisma.account.findFirst({
              where: {
                userId: session.user.id,
                providerId: 'google'
              },
              select: {
                scope: true
              }
            })

            if (!account || !hasCalendarScope(account.scope)) {
              return
            }

            try {
              await setupCalendarWatch(session.user.id)
            } catch (error: unknown) {
              ctx.context.logger.error(
                'Calendar setup after OAuth callback failed',
                { userId: session.user.id, error }
              )
            }
          })
        }
      ]
    }
  }
}

export { calendarPlugin }
