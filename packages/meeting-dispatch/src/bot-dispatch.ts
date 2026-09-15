import { parseBaasApiStatus } from '@repo/api-contract/baas-bot-status'
import { MEETING_CAPTURE_LEAD_MS } from './capture-window.js'
import { Prisma, prisma, type BaasBotStatus } from '@repo/db'

import { BOT_NAME, DISPATCH_BATCH_SIZE } from './constants.js'
import { DispatchError } from './errors.js'
import { createMeetingBaasClient } from './meeting-baas-client.js'

type DispatchMode = 'scheduled' | 'capture'

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

function _assertCaptureWindow(startTime: Date, nowMs: number) {
  const startMs = startTime.getTime()
  if (
    nowMs >= startMs - MEETING_CAPTURE_LEAD_MS &&
    nowMs < startMs
  ) {
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
      AND m."baasBotId" IS NULL
      AND m."endTime" > ${params.now}
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
    WHERE m."baasBotId" IS NULL
      AND m."endTime" > ${params.now}
      AND m."startTime" <= ${params.dueBy}
    ORDER BY m."startTime" ASC
    LIMIT 1
    FOR UPDATE OF m SKIP LOCKED
  `

  return rows[0] ?? null
}

async function _dispatchLockedMeeting(
  tx: Prisma.TransactionClient,
  row: LockedMeetingRow,
  meetingBaasApiKey: string
): Promise<DispatchResult> {
  if (row.baasBotId) {
    return _toDispatchResult(row)
  }

  const client = createMeetingBaasClient(meetingBaasApiKey)
  const createResult = await client.createBot({
    meeting_url: row.meetingUrl,
    bot_name: `${row.userName} ${BOT_NAME}`,
    transcription_enabled: true,
    allow_multiple_bots: false,
    timeout_config: {
      silence_timeout: 300,    
      no_one_joined_timeout: 120,
      waiting_room_timeout: 200  
    },    
    extra: { meetingId: row.id },
    transcription_config: {},
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
  let baasStatus: BaasBotStatus = 'queued'

  const statusResult = await client.getBotStatus({ bot_id: botId })
  if (statusResult.success) {
    baasStatus = parseBaasApiStatus(statusResult.data.status)
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
      startTime: true,
      endTime: true
    }
  })

  if (!existing) {
    throw new DispatchError(404, 'Meeting not found', params.meetingId)
  }

  if (existing.baasBotId) {
    return _toDispatchResult(existing)
  }

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
          select: { id: true, baasBotId: true, baasStatus: true }
        })
        if (row?.baasBotId) {
          return _toDispatchResult(row)
        }
        throw new DispatchError(
          409,
          'Could not lock meeting for dispatch',
          params.meetingId
        )
      }

      return _dispatchLockedMeeting(tx, locked, params.meetingBaasApiKey)
    },
    { timeout: 120_000 }
  )
}

async function dispatchDueMeetings(
  meetingBaasApiKey: string
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
          return _dispatchLockedMeeting(tx, locked, meetingBaasApiKey)
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
