import {
  canDispatchNewBot,
  mapBaasApiStatus
} from '@repo/api-contract/baas-bot-status'
import { Prisma, prisma, type BaasBotStatus } from '@repo/db'

import { MEETING_CAPTURE_LEAD_MS } from './capture-window.js'
import { DISPATCH_BATCH_SIZE, MEETING_BAAS_WEBHOOK_PATH } from './constants.js'
import { DispatchError } from './errors.js'
import { createMeetingBaasClient } from './meeting-baas-client.js'

type DispatchMode = 'scheduled' | 'capture'

type MeetingBaasCallbackParams = {
  callbackBaseUrl: string
  webhookSecret: string
}

type DispatchResult = {
  meetingId: string
  baasBotId: string
  baasStatus: BaasBotStatus | null
}

type DispatchDueResult = {
  dispatchedCount: number
  errors: { meetingId: string; message: string }[]
}

type LockedMeetingRow = {
  id: string
  meetingUrl: string
  userName: string
  baasBotId: string | null
  baasStatus: BaasBotStatus | null
}

type DispatchBotForMeetingParams = {
  meetingId: string
  userId?: string
  mode: DispatchMode
  meetingBaasApiKey: string
} & MeetingBaasCallbackParams

type DispatchDueMeetingsParams = {
  meetingBaasApiKey: string
} & MeetingBaasCallbackParams

function _callbackConfig(params: MeetingBaasCallbackParams) {
  const baseUrl = params.callbackBaseUrl.replace(/\/+$/, '')
  return {
    url: `${baseUrl}${MEETING_BAAS_WEBHOOK_PATH}`,
    secret: params.webhookSecret,
    method: 'POST' as const
  }
}

function _toDispatchResult(meeting: {
  id: string
  baasBotId: string | null
  baasStatus: BaasBotStatus | null
}): DispatchResult {
  if (!meeting.baasBotId) {
    throw new DispatchError(409, 'Meeting has no bot id', meeting.id)
  }

  return {
    meetingId: meeting.id,
    baasBotId: meeting.baasBotId,
    baasStatus: meeting.baasStatus
  }
}

function _assertCanDispatchNewBot(meeting: {
  id: string
  baasBotId: string | null
  baasStatus: BaasBotStatus | null
  recordingStartedAt: Date | null
  processingStatus: 'idle' | 'pending' | 'processing' | 'ready' | 'failed'
}) {
  if (!canDispatchNewBot(meeting)) {
    throw new DispatchError(
      409,
      'A bot is already active for this meeting',
      meeting.id
    )
  }
}

function _eligibleForNewBotDispatchSql() {
  return Prisma.sql`
    AND m."recordingStartedAt" IS NULL
    AND m."processingStatus" = 'idle'::"ProcessingStatus"
    AND (
      m."baasStatus" IS NULL
      OR m."baasStatus" = 'failed'::"BaasBotStatus"
    )
  `
}

function _assertCaptureWindow(startTime: Date, nowMs: number) {
  const startMs = startTime.getTime()
  if (nowMs >= startMs - MEETING_CAPTURE_LEAD_MS && nowMs < startMs) {
    throw new DispatchError(
      409,
      'Capture is unavailable while the bot is scheduled to join soon'
    )
  }
}

async function _lockMeetingRow(
  tx: Prisma.TransactionClient,
  params: {
    meetingId: string
    userId?: string
    dueBy: Date
    now: Date
    mode: DispatchMode
  }
): Promise<LockedMeetingRow | null> {
  const userFilter = params.userId
    ? Prisma.sql`AND m."userId" = ${params.userId}`
    : Prisma.empty

  const dueFilter =
    params.mode === 'scheduled'
      ? Prisma.sql`AND m."startTime" <= ${params.dueBy}`
      : Prisma.empty

  const rows = await tx.$queryRaw<LockedMeetingRow[]>`
    SELECT
      m.id,
      m."meetingUrl" AS "meetingUrl",
      m."baasBotId" AS "baasBotId",
      m."baasStatus" AS "baasStatus",
      u.name AS "userName"
    FROM meeting m
    INNER JOIN "user" u ON u.id = m."userId"
    WHERE m.id = ${params.meetingId}
      AND m."endTime" > ${params.now}
      ${_eligibleForNewBotDispatchSql()}
      ${dueFilter}
      ${userFilter}
    FOR UPDATE OF m SKIP LOCKED
  `

  return rows[0] ?? null
}

async function _lockNextDueMeetingRow(
  tx: Prisma.TransactionClient,
  params: { dueBy: Date; now: Date }
): Promise<LockedMeetingRow | null> {
  const rows = await tx.$queryRaw<LockedMeetingRow[]>`
    SELECT
      m.id,
      m."meetingUrl" AS "meetingUrl",
      m."baasBotId" AS "baasBotId",
      m."baasStatus" AS "baasStatus",
      u.name AS "userName"
    FROM meeting m
    INNER JOIN "user" u ON u.id = m."userId"
    WHERE m."endTime" > ${params.now}
      AND m."startTime" <= ${params.dueBy}
      ${_eligibleForNewBotDispatchSql()}
    ORDER BY m."startTime" ASC
    LIMIT 1
    FOR UPDATE OF m SKIP LOCKED
  `

  return rows[0] ?? null
}

async function _dispatchLockedMeeting(
  tx: Prisma.TransactionClient,
  row: LockedMeetingRow,
  params: { meetingBaasApiKey: string } & MeetingBaasCallbackParams
): Promise<DispatchResult> {
  if (row.baasBotId) {
    await tx.meeting.update({
      where: { id: row.id },
      data: {
        baasBotId: null,
        baasStatus: null,
        processingStatus: 'idle'
      }
    })
  }

  const client = createMeetingBaasClient(params.meetingBaasApiKey)
  const createResult = await client.createBot({
    meeting_url: row.meetingUrl,
    bot_name: `${row.userName}'s 8x Notetaker}`,
    transcription_enabled: true,
    allow_multiple_bots: false,
    timeout_config: {
      silence_timeout: 300,
      no_one_joined_timeout: 120,
      waiting_room_timeout: 200
    },
    extra: { meetingId: row.id },
    entry_message: `I am 8x Notetaker responsible to record this call and take notes 😉`,
    // bot_image:
    //   'https://sdmntprnortheu.oaiusercontent.com/files/00000000-7c30-81f4-8051-01ee58d6142d/raw?se=2026-09-15T16%3A07%3A32Z&sp=r&sv=2026-02-06&sr=b&scid=e4a73326-1d7b-49f6-ba7b-acd74fe5aea6&skoid=a3d7d4f3-706d-48bc-8860-17488c12cb39&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-09-14T20%3A20%3A21Z&ske=2026-09-15T20%3A20%3A21Z&sks=b&skv=2026-02-06&sig=8QrblDuze1/mk5t8qTnBki4dORGsJ8oT9srlRkb6q4k%3D',
    transcription_config: {},
    callback_enabled: true,
    callback_config: _callbackConfig(params)
  })

  if (!createResult.success) {
    const statusCode = createResult.statusCode >= 500 ? 502 : 400
    throw new DispatchError(
      statusCode,
      createResult.message || createResult.error,
      row.id
    )
  }

  const botId = createResult.data.bot_id
  let baasStatus: BaasBotStatus = 'joining'

  const statusResult = await client.getBotStatus({ bot_id: botId })
  if (statusResult.success) {
    baasStatus = mapBaasApiStatus(statusResult.data.status) ?? 'joining'
  }

  await tx.meeting.update({
    where: { id: row.id, baasBotId: null },
    data: { baasBotId: botId, baasStatus }
  })

  return {
    meetingId: row.id,
    baasBotId: botId,
    baasStatus
  }
}

async function dispatchBotForMeeting(
  params: DispatchBotForMeetingParams
): Promise<DispatchResult> {
  const now = new Date()
  const dueBy = new Date(now.getTime() + MEETING_CAPTURE_LEAD_MS)

  const existing = await prisma.meeting.findFirst({
    where: {
      id: params.meetingId,
      ...(params.userId ? { userId: params.userId } : {})
    },
    select: {
      id: true,
      baasBotId: true,
      baasStatus: true,
      recordingStartedAt: true,
      processingStatus: true,
      startTime: true,
      endTime: true
    }
  })

  if (!existing) {
    throw new DispatchError(404, 'Meeting not found', params.meetingId)
  }

  if (existing.baasBotId && !canDispatchNewBot(existing)) {
    return _toDispatchResult(existing)
  }

  _assertCanDispatchNewBot(existing)

  if (existing.endTime.getTime() <= now.getTime()) {
    throw new DispatchError(409, 'Meeting has ended', params.meetingId)
  }

  if (params.mode === 'capture') {
    _assertCaptureWindow(existing.startTime, now.getTime())
  }

  if (
    params.mode === 'scheduled' &&
    existing.startTime.getTime() > dueBy.getTime()
  ) {
    throw new DispatchError(
      409,
      'Meeting is not due for dispatch',
      params.meetingId
    )
  }

  return prisma.$transaction(
    async (tx) => {
      const locked = await _lockMeetingRow(tx, {
        meetingId: params.meetingId,
        userId: params.userId,
        dueBy,
        now,
        mode: params.mode
      })

      if (!locked) {
        const row = await tx.meeting.findFirst({
          where: {
            id: params.meetingId,
            ...(params.userId ? { userId: params.userId } : {})
          },
          select: {
            id: true,
            baasBotId: true,
            baasStatus: true,
            recordingStartedAt: true,
            processingStatus: true
          }
        })
        if (row?.baasBotId && !canDispatchNewBot(row)) {
          return _toDispatchResult(row)
        }
        throw new DispatchError(
          409,
          'Could not lock meeting for dispatch',
          params.meetingId
        )
      }

      return _dispatchLockedMeeting(tx, locked, params)
    },
    { timeout: 120_000 }
  )
}

async function dispatchDueMeetings(
  params: DispatchDueMeetingsParams
): Promise<DispatchDueResult> {
  const now = new Date()
  const dueBy = new Date(now.getTime() + MEETING_CAPTURE_LEAD_MS)
  const errors: DispatchDueResult['errors'] = []
  let dispatchedCount = 0

  for (let attempt = 0; attempt < DISPATCH_BATCH_SIZE; attempt += 1) {
    try {
      const dispatched = await prisma.$transaction(
        async (tx) => {
          const locked = await _lockNextDueMeetingRow(tx, { dueBy, now })
          if (!locked) {
            return null
          }
          return _dispatchLockedMeeting(tx, locked, params)
        },
        { timeout: 120_000 }
      )

      if (!dispatched) {
        break
      }
      dispatchedCount += 1
    } catch (error) {
      const meetingId =
        error instanceof DispatchError && error.meetingId
          ? error.meetingId
          : 'unknown'
      errors.push({
        meetingId,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { dispatchedCount, errors }
}

export { dispatchBotForMeeting, dispatchDueMeetings, DispatchError }
export type { DispatchDueResult, DispatchResult }
