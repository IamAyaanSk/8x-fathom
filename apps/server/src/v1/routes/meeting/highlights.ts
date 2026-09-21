import { Router } from 'express'

import {
  patchMeetingHighlightController,
  postMeetingHighlightController
} from '#src/v1/controllers/meeting/highlights'

const router = Router()

router.post('/:meetingId/highlights', postMeetingHighlightController)
router.patch(
  '/:meetingId/highlights/:highlightId',
  patchMeetingHighlightController
)

export { router as meetingHighlightsRouter }
