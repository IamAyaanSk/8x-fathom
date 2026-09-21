import { prisma } from '@repo/db'
import {
  createMeetingBaasClient,
  getBaasStatusRank,
  isParticipantBot,
  mapBaasStatus
} from '@repo/meeting-dispatch'

import { env } from '#src/env'
import { RECONCILE_BOT_STATUS_BATCH_SIZE } from '#src/reconcile-bot-status/constants'

export async function reconcileBotStatus() {
  try {
    const saneBackCheck = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

    let checkedCount = 0
    let updatedCount = 0

    const meetings = await prisma.meeting.findMany({
      where: {
        baasBotId: {
          not: null
        },
        endTime: {
          gt: saneBackCheck
        },
        OR: [
          { baasStatus: null },
          {
            baasStatus: {
              notIn: ['completed', 'failed']
            }
          }
        ]
      },
      select: {
        id: true,
        baasBotId: true,
        baasStatus: true,
        recordingStartedAt: true,
        processingStatus: true
      },
      take: RECONCILE_BOT_STATUS_BATCH_SIZE,
      orderBy: { startTime: 'asc' }
    })

    if (meetings.length === 0) {
      console.log('Status poll completed but no meetings found')
      return
    }

    const baasClient = createMeetingBaasClient(env.MEETINGBAAS_API_KEY)

    for (const meeting of meetings) {
      try {
        const botId = meeting.baasBotId

        if (!botId) {
          continue
        }

        const getBotStatusResult = await baasClient.getBotStatus({
          bot_id: botId
        })
        if (!getBotStatusResult.success) {
          console.error(
            `Bot status poll failed for ${meeting.id}: ${getBotStatusResult.message || getBotStatusResult.error}`
          )
          continue
        }

        const fetchedBaasStatus = mapBaasStatus(getBotStatusResult.data.status)

        if (!fetchedBaasStatus || meeting.baasStatus === fetchedBaasStatus) {
          checkedCount++
          continue
        }

        if (
          fetchedBaasStatus &&
          meeting.baasStatus &&
          getBaasStatusRank(fetchedBaasStatus) <
            getBaasStatusRank(meeting.baasStatus)
        ) {
          checkedCount++
          continue
        }

        if (fetchedBaasStatus !== 'completed') {
          const recordingStartedAt =
            fetchedBaasStatus === 'in_call_recording'
              ? new Date(getBotStatusResult.data.updated_at)
              : undefined

          await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              baasStatus: fetchedBaasStatus,
              recordingStartedAt
            }
          })
        } else {
          // New fecthed status is completed

          // Are we processing
          if (meeting.processingStatus !== 'idle') {
            checkedCount++
            continue
          }

          if (getBotStatusResult.data.transcription_status !== 'done') {
            checkedCount++
            continue
          }

          // Good to update our db
          const getBotArtifactsResult = await baasClient.getBotDetails({
            bot_id: botId
          })

          if (!getBotArtifactsResult.success) {
            console.error(`Failed to get bot artifacts for ${meeting.id}`)
            checkedCount++
            continue
          }

          // TODO: validate response from Baas

          const {
            video,
            transcription,
            raw_transcription,
            audio,
            chat_messages,
            participants: fetchedParticipants
          } = getBotArtifactsResult.data

          const participants =
            fetchedParticipants?.filter(
              (participant) => !isParticipantBot(participant.name)
            ) ?? []

          await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              baasStatus: 'completed',
              processingStatus: 'importing',
              baasSignedArtifactUrls: {
                video,
                transcription,
                rawTranscription: raw_transcription,
                audio,
                chatMessages: chat_messages
              },

              participants: {
                create: participants.map((p) => ({
                  name: p.name,
                  baasUserId: p.id,
                  displayName: p.display_name,
                  profilePicture: p.profile_picture
                }))
              }
            }
          })
        }

        updatedCount++
        checkedCount++
      } catch (error) {
        console.error('Error updating meeting status', meeting.id, error)
        continue
      }
    }
  } catch (error) {
    console.error('Status poll failed', error)
  }
}
