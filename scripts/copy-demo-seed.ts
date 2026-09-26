import { randomBytes, randomUUID, scryptSync } from 'node:crypto'

// Replicates @better-auth/utils password.mjs hash format: "salt_hex:key_hex"
function hashDemoPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password.normalize('NFKC'), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2
  })
  return `${salt}:${key.toString('hex')}`
}

import pg from 'pg'

const { Pool } = pg

interface ScriptOptions {
  sourceDbUrl: string
  targetDbUrl: string
  sourceUserIdOrEmail?: string
  demoEmail: string
  demoPassword?: string
  demoName: string
  clean: boolean
  ensureLiveMeeting: boolean
  shiftDates: boolean
}

function parseCliArgs(): ScriptOptions {
  const args = process.argv.slice(2)
  const options: ScriptOptions = {
    sourceDbUrl:
      process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL || '',
    targetDbUrl:
      process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || '',
    sourceUserIdOrEmail: undefined,
    demoEmail: process.env.DEMO_USER_EMAIL || 'demo@8xfathom.local',
    demoPassword: process.env.DEMO_USER_PASSWORD,
    demoName: 'Demo User',
    clean: true,
    ensureLiveMeeting: true,
    shiftDates: true
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx scripts/copy-demo-seed.ts [options]

Options:
  --source-user <id|email>     Source user ID or email to copy data from (required)
  --demo-email <email>         Demo user email in target DB (default: demo@8xfathom.local)
  --demo-password <password>   Password to set for the demo user account (also: DEMO_USER_PASSWORD env var)
  --demo-name <name>           Demo user display name (default: Demo User)
  --source-db <url>            Source Postgres connection string (default: SOURCE_DATABASE_URL or DATABASE_URL)
  --target-db <url>            Target Postgres connection string (default: TARGET_DATABASE_URL or DATABASE_URL)
  --clean <true|false>         Wipe previous demo meetings for this user first (default: true)
  --live-call <true|false>     Ensure one call is formatted as an active live recording (default: true)
  --shift-dates <true|false>   Refresh timestamps so live call is active now and upcoming is in future (default: true)
  -h, --help                   Show this help message
`)
      process.exit(0)
    }

    if (arg === '--source-user' && args[i + 1]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      options.sourceUserIdOrEmail = args[++i]!
    } else if (arg === '--demo-email' && args[i + 1]) {
      options.demoEmail = args[++i]!
    } else if (arg === '--demo-password' && args[i + 1]) {
      options.demoPassword = args[++i]!
    } else if (arg === '--demo-name' && args[i + 1]) {
      options.demoName = args[++i]!
    } else if (arg === '--source-db' && args[i + 1]) {
      options.sourceDbUrl = args[++i]!
    } else if (arg === '--target-db' && args[i + 1]) {
      options.targetDbUrl = args[++i]!
    } else if (arg === '--clean' && args[i + 1]) {
      options.clean = args[++i]! !== 'false'
    } else if (arg === '--live-call' && args[i + 1]) {
      options.ensureLiveMeeting = args[++i]! !== 'false'
    } else if (arg === '--shift-dates' && args[i + 1]) {
      options.shiftDates = args[++i]! !== 'false'
    }
  }

  return options
}

async function main() {
  const options = parseCliArgs()

  if (!options.sourceDbUrl) {
    console.error(
      'Error: Source database URL is required (specify --source-db or set DATABASE_URL).'
    )
    process.exit(1)
  }

  if (!options.targetDbUrl) {
    console.error(
      'Error: Target database URL is required (specify --target-db or set DATABASE_URL).'
    )
    process.exit(1)
  }

  const sourcePool = new Pool({ connectionString: options.sourceDbUrl })
  const targetPool =
    options.sourceDbUrl === options.targetDbUrl
      ? sourcePool
      : new Pool({ connectionString: options.targetDbUrl })

  try {
    console.log('Connecting to databases...')
    await sourcePool.query('SELECT 1')
    if (targetPool !== sourcePool) {
      await targetPool.query('SELECT 1')
    }
    console.log('Connected successfully.')

    // 1. Resolve source user
    let sourceUser: { id: string; email: string; name: string } | null = null

    if (options.sourceUserIdOrEmail) {
      const isEmail = options.sourceUserIdOrEmail.includes('@')
      const userRes = await sourcePool.query(
        `SELECT id, email, name FROM "user" WHERE ${isEmail ? 'email = $1' : 'id = $1'} LIMIT 1`,
        [options.sourceUserIdOrEmail]
      )
      if (userRes.rows.length > 0) {
        sourceUser = userRes.rows[0]
      }
    } else {
      // List available users if none specified
      const usersRes = await sourcePool.query(
        `SELECT u.id, u.email, u.name, COUNT(m.id)::int AS meeting_count
         FROM "user" u
         LEFT JOIN meeting m ON m."userId" = u.id
         GROUP BY u.id, u.email, u.name
         ORDER BY meeting_count DESC
         LIMIT 10`
      )
      console.log('\nAvailable source users in source DB:')
      for (const row of usersRes.rows) {
        console.log(
          `  - ${row.name} (${row.email}) | ID: ${row.id} | Meetings: ${row.meeting_count}`
        )
      }
      console.error(
        '\nPlease specify a source user via --source-user <id|email>'
      )
      process.exit(1)
    }

    if (!sourceUser) {
      console.error(
        `Error: Source user "${options.sourceUserIdOrEmail}" not found in source database.`
      )
      process.exit(1)
    }

    console.log(
      `\nSource user identified: ${sourceUser.name} (${sourceUser.email}) [ID: ${sourceUser.id}]`
    )

    // 2. Fetch source user's meetings
    const meetingsRes = await sourcePool.query(
      `SELECT * FROM meeting WHERE "userId" = $1 ORDER BY "startTime" ASC`,
      [sourceUser.id]
    )

    if (meetingsRes.rows.length === 0) {
      console.warn(
        `Warning: No meetings found for source user ${sourceUser.email}.`
      )
      process.exit(0)
    }

    console.log(
      `Found ${meetingsRes.rows.length} meetings to clone for demo user.`
    )

    // 3. Upsert target Demo User
    let demoUserId: string
    const existingDemoUser = await targetPool.query(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [options.demoEmail]
    )

    if (existingDemoUser.rows.length > 0) {
      demoUserId = existingDemoUser.rows[0].id
      console.log(`Found existing demo user with ID: ${demoUserId}`)
    } else {
      demoUserId = `demo_user_${randomBytes(6).toString('hex')}`
      await targetPool.query(
        `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, NOW(), NOW())`,
        [demoUserId, options.demoName, options.demoEmail]
      )
      console.log(
        `Created target demo user ${options.demoName} (${options.demoEmail}) [ID: ${demoUserId}]`
      )
    }

    // 3b. Upsert Better Auth credential account so demo user can sign in with email+password
    if (options.demoPassword) {
      console.log('Hashing demo password and upserting credential account...')
      const hashedPassword = hashDemoPassword(options.demoPassword)
      const existingAccount = await targetPool.query(
        `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
        [demoUserId]
      )
      if (existingAccount.rows.length > 0) {
        await targetPool.query(
          `UPDATE account SET password = $1, "updatedAt" = NOW() WHERE id = $2`,
          [hashedPassword, existingAccount.rows[0].id]
        )
        console.log('Updated existing credential account password.')
      } else {
        await targetPool.query(
          `INSERT INTO account ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
           VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
          [randomUUID(), demoUserId, demoUserId, hashedPassword]
        )
        console.log('Created credential account for demo user.')
      }
    } else {
      console.log(
        'Warning: --demo-password not set. Demo user will not be able to sign in via email+password.'
      )
    }

    // 4. Optionally wipe previous demo meetings if cleaning
    if (options.clean) {
      console.log(
        `Cleaning prior meetings for demo user ${options.demoEmail}...`
      )
      await targetPool.query(`DELETE FROM meeting WHERE "userId" = $1`, [
        demoUserId
      ])
      console.log('Cleared previous demo meetings.')
    }

    // 5. Clone meetings and their sub-resources
    const now = new Date()
    let liveMeetingConfigured = false

    // Identify which meeting should be the live recording call
    // Priority: any meeting already in_call_recording, or otherwise the first meeting if ensureLiveMeeting is true
    let liveSourceMeetingId: string | null = null
    if (options.ensureLiveMeeting) {
      const activeCall = meetingsRes.rows.find(
        (m) => m.baasStatus === 'in_call_recording'
      )
      liveSourceMeetingId = activeCall ? activeCall.id : meetingsRes.rows[0].id
    }

    for (const sourceMeeting of meetingsRes.rows) {
      const isLiveCandidate =
        options.ensureLiveMeeting && sourceMeeting.id === liveSourceMeetingId
      const targetMeetingId = `demo_meet_${randomBytes(8).toString('hex')}`
      const targetGoogleEventId = `demo_event_${randomBytes(8).toString('hex')}`
      const targetShareSlug = sourceMeeting.shareSlug
        ? `demo_${randomBytes(8).toString('base64url')}`
        : null

      let startTime = new Date(sourceMeeting.startTime)
      let endTime = new Date(sourceMeeting.endTime)
      let recordingStartedAt = sourceMeeting.recordingStartedAt
        ? new Date(sourceMeeting.recordingStartedAt)
        : null
      let baasStatus = sourceMeeting.baasStatus
      let processingStatus = sourceMeeting.processingStatus

      if (isLiveCandidate && !liveMeetingConfigured) {
        // Format as an actively recording live call
        baasStatus = 'in_call_recording'
        processingStatus = 'idle'
        recordingStartedAt = new Date(now.getTime() - 180 * 1000) // 3 mins ago
        startTime = new Date(now.getTime() - 300 * 1000) // 5 mins ago
        endTime = new Date(now.getTime() + 25 * 60 * 1000) // 25 mins in future
        liveMeetingConfigured = true
        console.log(`Configured as ACTIVE LIVE CALL: "${sourceMeeting.title}"`)
      } else if (
        options.shiftDates &&
        baasStatus !== 'completed' &&
        processingStatus !== 'ready'
      ) {
        // For upcoming non-completed meetings, place them into the upcoming window (e.g. tomorrow)
        const durationMs = endTime.getTime() - startTime.getTime()
        startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // tomorrow
        endTime = new Date(
          startTime.getTime() + (durationMs > 0 ? durationMs : 30 * 60 * 1000)
        )
      }

      // CRITICAL: Ensure baasBotId is null so worker's reconcile loop never attempts to query MeetingBaas for demo calls
      const baasBotId = null

      await targetPool.query(
        `INSERT INTO meeting (
          "id", "userId", "googleEventId", "title", "startTime", "endTime", "meetingUrl", "htmlLink",
          "baasBotId", "baasStatus", "processingStatus", "shareSlug", "recordingR2Key", "transcriptR2Key",
          "chatMessagesR2Key", "baasSignedArtifactUrls", "artifactsImportedAt", "recordingStartedAt",
          "summary", "actionItemsExtractedAt", "chatMessagesIngestedAt", "transcriptEmbeddingsExtractedAt",
          "processingLeaseExpiresAt", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, NOW(), NOW()
        )`,
        [
          targetMeetingId,
          demoUserId,
          targetGoogleEventId,
          sourceMeeting.title,
          startTime,
          endTime,
          sourceMeeting.meetingUrl,
          sourceMeeting.htmlLink,
          baasBotId,
          baasStatus,
          processingStatus,
          targetShareSlug,
          sourceMeeting.recordingR2Key,
          sourceMeeting.transcriptR2Key,
          sourceMeeting.chatMessagesR2Key,
          sourceMeeting.baasSignedArtifactUrls
            ? JSON.stringify(sourceMeeting.baasSignedArtifactUrls)
            : null,
          sourceMeeting.artifactsImportedAt,
          recordingStartedAt,
          sourceMeeting.summary,
          sourceMeeting.actionItemsExtractedAt,
          sourceMeeting.chatMessagesIngestedAt,
          sourceMeeting.transcriptEmbeddingsExtractedAt,
          null
        ]
      )

      console.log(
        `Cloned meeting "${sourceMeeting.title}" -> ${targetMeetingId}`
      )

      // 5a. Clone Participants
      const participantsRes = await sourcePool.query(
        `SELECT * FROM meeting_participant WHERE "meetingId" = $1`,
        [sourceMeeting.id]
      )
      for (const p of participantsRes.rows) {
        await targetPool.query(
          `INSERT INTO meeting_participant ("id", "meetingId", "name", "baasUserId", "displayName", "profilePicture", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            randomUUID(),
            targetMeetingId,
            p.name,
            p.baasUserId,
            p.displayName,
            p.profilePicture,
            p.createdAt
          ]
        )
      }

      // 5b. Clone Highlights
      const highlightsRes = await sourcePool.query(
        `SELECT * FROM highlight WHERE "meetingId" = $1`,
        [sourceMeeting.id]
      )
      for (const h of highlightsRes.rows) {
        await targetPool.query(
          `INSERT INTO highlight ("id", "meetingId", "timestampSec", "endTimestampSec", "note", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            randomUUID(),
            targetMeetingId,
            h.timestampSec,
            h.endTimestampSec,
            h.note,
            h.createdAt
          ]
        )
      }

      // 5c. Clone Scratchpad Entries
      const scratchpadRes = await sourcePool.query(
        `SELECT * FROM scratchpad_entry WHERE "meetingId" = $1`,
        [sourceMeeting.id]
      )
      for (const s of scratchpadRes.rows) {
        await targetPool.query(
          `INSERT INTO scratchpad_entry ("id", "meetingId", "timestampSec", "text", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            randomUUID(),
            targetMeetingId,
            s.timestampSec,
            s.text,
            s.createdAt,
            s.updatedAt
          ]
        )
      }

      // 5d. Clone Action Items
      const actionItemsRes = await sourcePool.query(
        `SELECT * FROM action_item WHERE "meetingId" = $1`,
        [sourceMeeting.id]
      )
      for (const a of actionItemsRes.rows) {
        await targetPool.query(
          `INSERT INTO action_item ("id", "meetingId", "text", "timestampSec", "completed", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            randomUUID(),
            targetMeetingId,
            a.text,
            a.timestampSec,
            a.completed,
            a.createdAt,
            a.updatedAt
          ]
        )
      }

      // 5e. Clone Chat Messages
      const chatMessagesRes = await sourcePool.query(
        `SELECT * FROM meeting_chat_message WHERE "meetingId" = $1`,
        [sourceMeeting.id]
      )
      for (const c of chatMessagesRes.rows) {
        await targetPool.query(
          `INSERT INTO meeting_chat_message ("id", "meetingId", "baasMessageId", "senderName", "baasSenderId", "text", "sentAt", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            randomUUID(),
            targetMeetingId,
            c.baasMessageId,
            c.senderName,
            c.baasSenderId,
            c.text,
            c.sentAt,
            c.createdAt
          ]
        )
      }

      // 5f. Clone Transcript Chunks with pgvector embeddings
      const chunksRes = await sourcePool.query(
        `SELECT id, "startSec", "endSec", speaker, text, embedding::text AS embedding_text
         FROM transcript_chunk
         WHERE "meetingId" = $1`,
        [sourceMeeting.id]
      )

      for (const chunk of chunksRes.rows) {
        if (chunk.embedding_text) {
          await targetPool.query(
            `INSERT INTO transcript_chunk ("id", "meetingId", "startSec", "endSec", "speaker", "text", "embedding", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())`,
            [
              randomUUID(),
              targetMeetingId,
              chunk.startSec,
              chunk.endSec,
              chunk.speaker,
              chunk.text,
              chunk.embedding_text
            ]
          )
        } else {
          console.warn(
            `Warning: Chunk ${chunk.id} has no embedding. Skipped vector insertion.`
          )
        }
      }

      console.log(
        `Copied ${participantsRes.rows.length} participants, ${highlightsRes.rows.length} highlights, ${scratchpadRes.rows.length} notes, ${actionItemsRes.rows.length} action items, ${chunksRes.rows.length} vector chunks.`
      )
    }

    const upcomingTemplate = meetingsRes.rows.find(
      (meeting) =>
        typeof meeting.meetingUrl === 'string' && meeting.meetingUrl.length > 0
    )

    if (upcomingTemplate) {
      const upcomingDays = 30
      const dailyStartHours = [10, 14]
      const durationMs = 45 * 60 * 1000

      console.log(
        `Creating ${upcomingDays * dailyStartHours.length} duplicate upcoming demo events across the next ${upcomingDays} days...`
      )

      for (let dayOffset = 1; dayOffset <= upcomingDays; dayOffset += 1) {
        for (const startHour of dailyStartHours) {
          const startTime = new Date(now)
          startTime.setDate(startTime.getDate() + dayOffset)
          startTime.setHours(startHour, 0, 0, 0)
          const endTime = new Date(startTime.getTime() + durationMs)

          await targetPool.query(
            `INSERT INTO meeting (
              "id", "userId", "googleEventId", "title", "startTime", "endTime", "meetingUrl", "htmlLink",
              "baasBotId", "baasStatus", "processingStatus", "shareSlug", "recordingR2Key", "transcriptR2Key",
              "chatMessagesR2Key", "baasSignedArtifactUrls", "artifactsImportedAt", "recordingStartedAt",
              "summary", "actionItemsExtractedAt", "chatMessagesIngestedAt", "transcriptEmbeddingsExtractedAt",
              "processingLeaseExpiresAt", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              NULL, NULL, 'idle', NULL, NULL, NULL,
              NULL, NULL, NULL, NULL,
              NULL, NULL, NULL, NULL,
              NULL, NOW(), NOW()
            )`,
            [
              `demo_meet_${randomBytes(8).toString('hex')}`,
              demoUserId,
              `demo_event_${randomBytes(8).toString('hex')}`,
              upcomingTemplate.title,
              startTime,
              endTime,
              upcomingTemplate.meetingUrl,
              upcomingTemplate.htmlLink
            ]
          )
        }
      }
    } else {
      console.warn(
        'Warning: Could not create recurring upcoming demo events because the source user has no meeting URL.'
      )
    }

    console.log(
      `\nDemo seed data cloning completed successfully for ${options.demoEmail}!`
    )
    console.log(`Demo User ID: ${demoUserId}`)
  } catch (error) {
    console.error('Fatal error copying demo seed data:', error)
    process.exit(1)
  } finally {
    await sourcePool.end()
    if (targetPool !== sourcePool) {
      await targetPool.end()
    }
  }
}

void main()
