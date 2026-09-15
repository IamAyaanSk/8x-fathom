import { randomUUID } from 'node:crypto'

import { prisma } from '@repo/db'
import { cancelJoiningBotForDeletedCalendarEvent } from '@repo/meeting-dispatch'
import { google, type calendar_v3 } from 'googleapis'

import { env } from '#src/env'
import {
  CALENDAR_SYNC_WINDOW_DAYS,
  CALENDAR_WEBHOOK_PATH,
  PRIMARY_CALENDAR_ID
} from '#src/services/calendar-constants'
import { extractMeetingUrlFromGoogleEvent } from '#src/services/extract-meeting-url'
import { getGoogleAccessTokenForUser } from '#src/services/google-account'

type SyncResult = { syncedCount: number }
type SetupResult = SyncResult & { watchRegistered: boolean }
type FetchEventsResult = {
  events: calendar_v3.Schema$Event[]
  syncToken: string | null
}

const WATCH_RENEW_BEFORE_MS = 24 * 60 * 60 * 1000
const WATCH_DURATION_MS = 7 * 24 * 60 * 60 * 1000 - 60_000

const syncChains = new Map<string, Promise<SyncResult>>()

function getClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth })
}

function isSyncTokenError(error: any): boolean {
  const status = error?.code ?? error?.response?.status
  if (status === 410) return true
  return status === 400 && /sync\s*token/i.test(error?.message ?? '')
}

function resolveMeetingUrl(event: calendar_v3.Schema$Event): string | null {
  return extractMeetingUrlFromGoogleEvent(event) ?? null
}

async function fetchEvents(
  calendar: calendar_v3.Calendar,
  params: calendar_v3.Params$Resource$Events$List
): Promise<FetchEventsResult> {
  const events: calendar_v3.Schema$Event[] = []
  let pageToken: string | undefined
  let syncToken: string | null = null

  do {
    const { data } = await calendar.events.list({ ...params, pageToken })
    if (data.items) events.push(...data.items)
    pageToken = data.nextPageToken ?? undefined
    syncToken = data.nextSyncToken ?? syncToken
  } while (pageToken)

  return { events, syncToken }
}

async function saveEvent(
  userId: string,
  event: calendar_v3.Schema$Event,
  timeMin: Date,
  timeMax: Date
): Promise<boolean> {
  if (!event.id) return false

  const meetingUrl =
    event.status !== 'cancelled' ? resolveMeetingUrl(event) : null

  if (!meetingUrl) {
    await cancelJoiningBotForDeletedCalendarEvent({
      userId,
      googleEventId: event.id,
      meetingBaasApiKey: env.MEETINGBAAS_API_KEY
    })
    await prisma.meeting.deleteMany({
      where: { userId, googleEventId: event.id, baasBotId: null }
    })
    return false
  }

  const startTime = new Date(event.start?.dateTime ?? event.start?.date ?? '')
  const endTime = new Date(event.end?.dateTime ?? event.end?.date ?? '')
  if (Number.isNaN(+startTime) || Number.isNaN(+endTime)) return false
  if (startTime >= timeMax || endTime <= timeMin) return false

  const data = {
    title: event.summary?.trim() || 'Untitled event',
    startTime,
    endTime,
    meetingUrl,
    htmlLink: event.htmlLink ?? null
  }

  await prisma.meeting.upsert({
    where: { userId, googleEventId: event.id },
    create: { userId, googleEventId: event.id, ...data },
    update: data
  })

  return true
}

async function fetchEventsWithTokenRecovery(
  userId: string,
  calendar: calendar_v3.Calendar,
  watchSyncToken: string | null | undefined,
  baseParams: calendar_v3.Params$Resource$Events$List,
  timeMin: Date
): Promise<FetchEventsResult> {
  const listParams = watchSyncToken
    ? { ...baseParams, syncToken: watchSyncToken }
    : { ...baseParams, timeMin: timeMin.toISOString() }

  try {
    return await fetchEvents(calendar, listParams)
  } catch (error) {
    if (isSyncTokenError(error) && watchSyncToken) {
      await prisma.calendarWatch.update({
        where: { userId },
        data: { syncToken: null }
      })
      return fetchEventsWithTokenRecovery(
        userId,
        calendar,
        null,
        baseParams,
        timeMin
      )
    }
    throw error
  }
}

async function runSync(userId: string): Promise<SyncResult> {
  const calendar = getClient(await getGoogleAccessTokenForUser(userId))
  const watch = await prisma.calendarWatch.findUnique({ where: { userId } })

  const timeMin = new Date()
  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMax.getDate() + CALENDAR_SYNC_WINDOW_DAYS)

  const baseParams: calendar_v3.Params$Resource$Events$List = {
    calendarId: PRIMARY_CALENDAR_ID,
    singleEvents: true,
    showDeleted: true
  }

  const { events, syncToken } = await fetchEventsWithTokenRecovery(
    userId,
    calendar,
    watch?.syncToken,
    baseParams,
    timeMin
  )

  let syncedCount = 0
  for (const event of events) {
    if (await saveEvent(userId, event, timeMin, timeMax)) syncedCount++
  }

  if (syncToken) {
    await prisma.calendarWatch.updateMany({
      where: { userId },
      data: { syncToken }
    })
  }

  return { syncedCount }
}

async function syncCalendarEventsForUser(userId: string): Promise<SyncResult> {
  const previousRun = syncChains.get(userId) ?? Promise.resolve()
  const thisRun = previousRun.catch(() => undefined).then(() => runSync(userId))
  syncChains.set(userId, thisRun)

  try {
    return await thisRun
  } finally {
    if (syncChains.get(userId) === thisRun) syncChains.delete(userId)
  }
}

function getCalendarWebhookUrl(): string {
  return `${env.BASE_URL.replace(/\/$/, '')}/api/auth${CALENDAR_WEBHOOK_PATH}`
}

async function ensureCalendarWatch(
  userId: string,
  calendar: calendar_v3.Calendar
): Promise<boolean> {
  if (!env.BASE_URL.startsWith('https://')) return false

  const existing = await prisma.calendarWatch.findUnique({ where: { userId } })
  const isPlaceholder = existing?.channelId.startsWith('local-')
  const expiringSoon =
    existing &&
    existing.expiration.getTime() - Date.now() < WATCH_RENEW_BEFORE_MS

  if (existing && !isPlaceholder && !expiringSoon) return true

  if (existing && !isPlaceholder) {
    try {
      await calendar.channels.stop({
        requestBody: { id: existing.channelId, resourceId: existing.resourceId }
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
      address: getCalendarWebhookUrl(),
      token: randomUUID(),
      expiration: String(Date.now() + WATCH_DURATION_MS)
    }
  })

  if (!data.resourceId || !data.expiration) {
    throw new Error('Google Calendar watch response was incomplete')
  }

  await prisma.calendarWatch.upsert({
    where: { userId },
    create: {
      userId,
      channelId,
      resourceId: data.resourceId,
      channelToken: randomUUID(),
      expiration: new Date(Number(data.expiration)),
      syncToken: existing?.syncToken ?? null
    },
    update: {
      channelId,
      resourceId: data.resourceId,
      expiration: new Date(Number(data.expiration))
    }
  })

  return true
}

async function setupCalendarWatchAndSync(userId: string): Promise<SetupResult> {
  const calendar = getClient(await getGoogleAccessTokenForUser(userId))
  const watchRegistered = await ensureCalendarWatch(userId, calendar)
  const { syncedCount } = await syncCalendarEventsForUser(userId)
  return { syncedCount, watchRegistered }
}

function scheduleCalendarSyncFromWebhook(userId: string): void {
  void syncCalendarEventsForUser(userId).catch((error) =>
    console.error('Calendar webhook sync failed', { userId, error })
  )
}

export {
  getCalendarWebhookUrl,
  scheduleCalendarSyncFromWebhook,
  setupCalendarWatchAndSync,
  syncCalendarEventsForUser
}

export type {
  SetupResult as SetupCalendarWatchAndSyncResult,
  SyncResult as SyncCalendarResult
}
