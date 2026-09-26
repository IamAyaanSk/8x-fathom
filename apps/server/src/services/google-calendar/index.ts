import { randomUUID } from 'node:crypto'

import { prisma } from '@repo/db'
import { cancelJoiningBotForDeletedCalendarEvent } from '@repo/meeting-dispatch'
import { calendar_v3, google } from 'googleapis'
import { DateTime } from 'luxon'

import { env } from '#src/env'
import { getGoogleAccessTokenForUser } from '#src/services/google-account/index'
import {
  CALENDAR_SCOPE_MARKERS,
  CALENDAR_SYNC_WINDOW_DAYS,
  CALENDAR_WATCH_DURATION_MS,
  CALENDAR_WATCH_RENEW_BEFORE_MS,
  CALENDAR_WEBHOOK_PATH,
  PRIMARY_CALENDAR_ID
} from '#src/services/google-calendar/constants'
import {
  GoogleCalendarEventSchema,
  GoogleCalendarWatchResponseSchema
} from '#src/services/google-calendar/validations'
import { extractMeetingUrlFromGoogleEvent } from '#src/services/meeting/index'

function _getCalendarWebhookUrl(): string {
  return `${env.BASE_URL.replace(/\/$/, '')}/api/auth${CALENDAR_WEBHOOK_PATH}`
}

function _getGoogleCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth })
}

function hasCalendarScope(scope: string | null | undefined): boolean {
  if (!scope) {
    return false
  }

  return CALENDAR_SCOPE_MARKERS.some((marker) => scope.includes(marker))
}

async function setupCalendarWatch(userId: string) {
  // Skip setting up calendar watch if not using https
  if (!env.BASE_URL.startsWith('https://')) {
    throw new Error('Calendar watch can only be set up on https')
  }

  const accessToken = await getGoogleAccessTokenForUser(userId)
  const calendar = _getGoogleCalendarClient(accessToken)

  const existingCalendarWatch = await prisma.calendarWatch.findUnique({
    where: { userId }
  })

  if (existingCalendarWatch) {
    const isExpiringSoon =
      existingCalendarWatch.expiration.getTime() - Date.now() <
      CALENDAR_WATCH_RENEW_BEFORE_MS

    if (!isExpiringSoon) return

    try {
      await calendar.channels.stop({
        requestBody: {
          id: existingCalendarWatch.channelId,
          resourceId: existingCalendarWatch.resourceId
        }
      })
    } catch {
      // already expired/stopped, ignore
    }
  }

  const channelId = randomUUID()

  const { data } = await calendar.events.watch({
    calendarId: PRIMARY_CALENDAR_ID,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: _getCalendarWebhookUrl(),
      token: randomUUID(),
      expiration: String(Date.now() + CALENDAR_WATCH_DURATION_MS)
    }
  })

  const validatedResponse = GoogleCalendarWatchResponseSchema.parse(data)

  await prisma.calendarWatch.upsert({
    where: { userId },
    create: {
      userId,
      channelId,
      resourceId: validatedResponse.resourceId,
      channelToken: randomUUID(),
      expiration: validatedResponse.expiration,
      syncToken: existingCalendarWatch?.syncToken ?? null
    },
    update: {
      channelId,
      resourceId: validatedResponse.resourceId,
      expiration: validatedResponse.expiration
    }
  })
}

type SyncResult = { syncedCount: number }
// ! TODO-ARCHITECTURE: Move this state to DB or Redis if we change server architecture to multi machines
const syncChains = new Map<string, Promise<SyncResult>>()

async function _runCalendarSync(userId: string) {
  const accessToken = await getGoogleAccessTokenForUser(userId)
  const calendar = _getGoogleCalendarClient(accessToken)

  const syncWindowStart = DateTime.now()
  const syncWindowEnd = syncWindowStart.plus({
    days: CALENDAR_SYNC_WINDOW_DAYS
  })

  const events: calendar_v3.Schema$Event[] = []

  let pageToken: string | undefined

  do {
    const { data } = await calendar.events.list({
      calendarId: PRIMARY_CALENDAR_ID,
      singleEvents: true,
      showDeleted: true,
      pageToken,
      timeMin: syncWindowStart.toJSDate().toISOString(),
      timeMax: syncWindowEnd.toJSDate().toISOString()
    })

    // TODO: Validate with zod in future
    if (data.items) events.push(...data.items)
    pageToken = data.nextPageToken ?? undefined
  } while (pageToken)

  const validGoogleEventIds = new Set<string>()
  let syncedCount = 0

  for (const event of events) {
    const validatedEvent = GoogleCalendarEventSchema.safeParse(event)
    if (!validatedEvent.success || validatedEvent.data.status === 'cancelled')
      continue

    const meetingUrl = extractMeetingUrlFromGoogleEvent(event)
    if (!meetingUrl) continue

    const { id, summary, start, end, htmlLink } = validatedEvent.data

    await prisma.meeting.upsert({
      where: { userId, googleEventId: id },
      create: {
        userId,
        googleEventId: id,
        title: summary?.trim() || 'Untitled event',
        startTime: start.dateTime,
        endTime: end.dateTime,
        meetingUrl,
        htmlLink: htmlLink ?? null
      },
      update: {
        googleEventId: id,
        title: summary?.trim() || 'Untitled event',
        startTime: start.dateTime,
        endTime: end.dateTime,
        meetingUrl,
        htmlLink: htmlLink ?? null
      }
    })

    validGoogleEventIds.add(id)
    syncedCount++
  }

  const existingMeetingsInWindow = await prisma.meeting.findMany({
    where: {
      userId,
      startTime: {
        gte: syncWindowStart.toJSDate(),
        lt: syncWindowEnd.toJSDate()
      }
    },
    select: { googleEventId: true, baasBotId: true }
  })

  for (const meeting of existingMeetingsInWindow) {
    if (!validGoogleEventIds.has(meeting.googleEventId)) {
      await cancelJoiningBotForDeletedCalendarEvent({
        userId,
        googleEventId: meeting.googleEventId,
        meetingBaasApiKey: env.MEETINGBAAS_API_KEY
      })

      if (!meeting.baasBotId) {
        await prisma.meeting.deleteMany({
          where: { userId, googleEventId: meeting.googleEventId }
        })
      }
    }
  }

  await prisma.calendarWatch
    .updateMany({
      where: { userId },
      data: { updatedAt: new Date() }
    })
    .catch(() => undefined)

  return { syncedCount }
}

async function syncCalendarEvents(userId: string) {
  const existingSyncRun = syncChains.get(userId)

  if (existingSyncRun) {
    // wait for it to complete before scheduling new run
    try {
      await existingSyncRun
    } catch {
      // ok let it be, will run new sync
    }
  }

  const thisRun = _runCalendarSync(userId)
  syncChains.set(userId, thisRun)

  try {
    const { syncedCount } = await thisRun
    return { syncedCount }
  } finally {
    if (syncChains.get(userId) === thisRun) syncChains.delete(userId)
  }
}

export { hasCalendarScope, setupCalendarWatch, syncCalendarEvents }
