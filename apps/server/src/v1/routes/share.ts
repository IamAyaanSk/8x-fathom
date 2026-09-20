import { Router } from 'express'

import {
  getMeetingShareDetailController,
  getMeetingShareTranscriptController
} from '#src/v1/controllers/meeting/share'

const router = Router()

router.get('/:shareSlug', getMeetingShareDetailController)
router.get('/:shareSlug/transcript', getMeetingShareTranscriptController)

export { router as shareRouter }
