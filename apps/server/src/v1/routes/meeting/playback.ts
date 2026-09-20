import { Router } from 'express'

import {
  getMeetingDetailController,
  getMeetingTranscriptController
} from '#src/v1/controllers/meeting/playback'

const router = Router()

router.get('/:meetingId', getMeetingDetailController)
router.get('/:meetingId/transcript', getMeetingTranscriptController)

export { router as meetingPlaybackRouter }
