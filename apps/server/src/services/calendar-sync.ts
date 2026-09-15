import { randomUUID } from 'node:crypto'

import { prisma } from '@repo/db'
import { google, type calendar_v3 } from 'googleapis'

import { env } from '#src/env'
import {
  CALENDAR_SYNC_WINDOW_DAYS,
  CALENDAR_WEBHOOK_PATH,
  PRIMARY_CALENDAR_ID
} from '#src/services/calendar-constants'
import { extractMeetingUrlFromGoogleEvent } from '#src/services/extract-meeting-url'
import { getGoogleAccessTokenForUser } from '#src/services/google-account'
type SyncCalendarResult = {
  syncedCount: number
}

type SetupCalendarWatchAndSyncResult = SyncCalendarResult & {
  watchRegistered: boolean
}

function getSyncTimeWindow(): { timeMin: Date; timeMax: Date } {
  const timeMin = new Date()
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + CALENDAR_SYNC_WINDOW_DAYS)
  return { timeMin, timeMax }
}

function isWithinSyncWindow(
  startTime: Date,
  endTime: Date,
  window: { timeMin: Date; timeMax: Date }
): boolean {
  return startTime < window.timeMax && endTime > window.timeMin
}

function parseGoogleEventTimes(event: calendar_v3.Schema$Event): {
  startTime: Date
  endTime: Date
} | null {
  const startRaw = event.start?.dateTime ?? event.start?.date
  const endRaw = event.end?.dateTime ?? event.end?.date

  if (!startRaw || !endRaw) {
    return null
  }

  const startTime = new Date(startRaw)
  const endTime = new Date(endRaw)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return null
  }

  return { startTime, endTime }
}

function createGoogleCalendarClient(accessToken: string): calendar_v3.Calendar {
  const oauthClient = new google.auth.OAuth2()
  oauthClient.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth: oauthClient })
}

function getCalendarWebhookUrl(): string {
  const base = env.BETTER_AUTH_URL.replace(/\/$/, '')
  return `${base}/api/auth${CALENDAR_WEBHOOK_PATH}`
}

function canRegisterCalendarWatch(): boolean {
  return env.BETTER_AUTH_URL.startsWith('https://')
}

async function deletePreDispatchMeetingsForGoogleEvent(
  userId: string,
  googleEventId: string
): Promise<void> {
  await prisma.meeting.deleteMany({
    where: {
      userId,
      googleEventId,
      baasBotId: null
    }
  })
}

async function persistEligibleMeetingFromGoogleEvent(
  userId: string,
  event: calendar_v3.Schema$Event,
  window: { timeMin: Date; timeMax: Date }
): Promise<boolean> {
  if (!event.id) {
    return false
  }

  if (event.status === 'cancelled') {
    await deletePreDispatchMeetingsForGoogleEvent(userId, event.id)
    return false
  }

  const times = parseGoogleEventTimes(event)
  if (!times) {
    return false
  }

  const meetingUrl = extractMeetingUrlFromGoogleEvent(event)
  if (!meetingUrl) {
    await deletePreDispatchMeetingsForGoogleEvent(userId, event.id)
    return false
  }

  if (!isWithinSyncWindow(times.startTime, times.endTime, window)) {
    return false
  }

  const title = event.summary?.trim() || 'Untitled event'
  const htmlLink = event.htmlLink ?? null

  await prisma.meeting.upsert({
    where: { googleEventId: event.id },
    create: {
      userId,
      googleEventId: event.id,
      title,
      startTime: times.startTime,
      endTime: times.endTime,
      meetingUrl,
      htmlLink
    },
    update: {
      title,
      startTime: times.startTime,
      endTime: times.endTime,
      meetingUrl,
      htmlLink
    }
  })

  return true
}

async function listAllCalendarEvents(
  calendar: calendar_v3.Calendar,
  params: calendar_v3.Params$Resource$Events$List
): Promise<{
  events: calendar_v3.Schema$Event[]
  nextSyncToken: string | null | undefined
}> {
  const events: calendar_v3.Schema$Event[] = []
  let pageToken: string | undefined
  let nextSyncToken: string | null | undefined

  do {
    const response = await calendar.events.list({
      ...params,
      pageToken
    })

    if (response.data.items) {
      events.push(...response.data.items)
    }

    pageToken = response.data.nextPageToken ?? undefined
    nextSyncToken = response.data.nextSyncToken
  } while (pageToken)

  return { events, nextSyncToken }
}

async function syncCalendarEventsForUser(
  userId: string
): Promise<SyncCalendarResult> {
  const accessToken = await getGoogleAccessTokenForUser(userId)
  const calendar = createGoogleCalendarClient(accessToken)
  const window = getSyncTimeWindow()

  const watch = await prisma.calendarWatch.findUnique({
    where: { userId }
  })

  let syncedCount = 0
  let nextSyncToken: string | null | undefined

  try {
    if (watch?.syncToken) {
      const { events, nextSyncToken: token } = await listAllCalendarEvents(
        calendar,
        {
          calendarId: PRIMARY_CALENDAR_ID,
          syncToken: watch.syncToken
        }
      )
      nextSyncToken = token

      for (const event of events) {
        const persisted = await persistEligibleMeetingFromGoogleEvent(
          userId,
          event,
          window
        )
        if (persisted) {
          syncedCount += 1
        }
      }
    } else {
      const { events, nextSyncToken: token } = await listAllCalendarEvents(
        calendar,
        {
          calendarId: PRIMARY_CALENDAR_ID,
          timeMin: window.timeMin.toISOString(),
          timeMax: window.timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        }
      )
      nextSyncToken = token

      for (const event of events) {
        const persisted = await persistEligibleMeetingFromGoogleEvent(
          userId,
          event,
          window
        )
        if (persisted) {
          syncedCount += 1
        }
      }
    }
  } catch (error: unknown) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'number'
        ? error.code
        : null

    if (statusCode === 410 && watch) {
      await prisma.calendarWatch.update({
        where: { userId },
        data: { syncToken: null }
      })
      return syncCalendarEventsForUser(userId)
    }

    throw error
  }

  if (nextSyncToken) {
    const existingWatch = await prisma.calendarWatch.findUnique({
      where: { userId }
    })

    if (existingWatch) {
      await prisma.calendarWatch.update({
        where: { userId },
        data: { syncToken: nextSyncToken }
      })
    } else {
      await prisma.calendarWatch.create({
        data: {
          userId,
          channelId: `local-${userId}`,
          resourceId: `local-${userId}`,
          channelToken: randomUUID(),
          expiration: new Date(0),
          syncToken: nextSyncToken
        }
      })
    }
  }

  return { syncedCount }
}

async function stopExistingCalendarWatch(
  calendar: calendar_v3.Calendar,
  watch: {
    channelId: string
    resourceId: string
  }
): Promise<void> {
  if (!watch.channelId || !watch.resourceId) {
    return
  }

  try {
    await calendar.channels.stop({
      requestBody: {
        id: watch.channelId,
        resourceId: watch.resourceId
      }
    })
  } catch {
    // Channel may already be expired or stopped.
  }
}

async function registerCalendarWatch(
  userId: string,
  calendar: calendar_v3.Calendar
): Promise<boolean> {
  if (!canRegisterCalendarWatch()) {
    return false
  }

  const existingWatch = await prisma.calendarWatch.findUnique({
    where: { userId }
  })

  if (existingWatch?.channelId && existingWatch.resourceId) {
    await stopExistingCalendarWatch(calendar, existingWatch)
  }

  const channelId = randomUUID()
  const channelToken = randomUUID()
  const expirationMs = Date.now() + 7 * 24 * 60 * 60 * 1000 - 60_000

  const response = await calendar.events.watch({
    calendarId: PRIMARY_CALENDAR_ID,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: getCalendarWebhookUrl(),
      token: channelToken,
      expiration: expirationMs.toString()
    }
  })

  const resourceId = response.data.resourceId
  const expirationRaw = response.data.expiration

  if (!resourceId || !expirationRaw) {
    throw new Error('Google Calendar watch response was incomplete')
  }

  const expiration = new Date(Number(expirationRaw))

  await prisma.calendarWatch.upsert({
    where: { userId },
    create: {
      userId,
      channelId,
      resourceId,
      channelToken,
      expiration,
      syncToken: existingWatch?.syncToken ?? null
    },
    update: {
      channelId,
      resourceId,
      channelToken,
      expiration
    }
  })

  return true
}

async function setupCalendarWatchAndSync(
  userId: string
): Promise<SetupCalendarWatchAndSyncResult> {
  const syncResult = await syncCalendarEventsForUser(userId)
  const accessToken = await getGoogleAccessTokenForUser(userId)
  const calendar = createGoogleCalendarClient(accessToken)

  let watchRegistered = false
  if (canRegisterCalendarWatch()) {
    watchRegistered = await registerCalendarWatch(userId, calendar)
  }

  return {
    syncedCount: syncResult.syncedCount,
    watchRegistered
  }
}

function scheduleCalendarSyncFromWebhook(userId: string): void {
  void syncCalendarEventsForUser(userId).catch((error: unknown) => {
    console.error('Calendar webhook sync failed', { userId, error })
  })
}

export {
  getCalendarWebhookUrl,
  scheduleCalendarSyncFromWebhook,
  setupCalendarWatchAndSync,
  syncCalendarEventsForUser
}

export type { SetupCalendarWatchAndSyncResult, SyncCalendarResult }
