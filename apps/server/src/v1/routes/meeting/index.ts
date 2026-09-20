import { Router } from 'express'

import {
  getMeetingsCompletedController,
  getMeetingsUpcomingController,
  postMeetingCaptureController
} from '#src/v1/controllers/meeting/index'
import { meetingActionItemsRouter } from '#src/v1/routes/meeting/action-items'
import { meetingAssistantRouter } from '#src/v1/routes/meeting/assistant'
import { meetingHighlightsRouter } from '#src/v1/routes/meeting/highlights'
import { meetingPlaybackRouter } from '#src/v1/routes/meeting/playback'
import { meetingScratchpadRouter } from '#src/v1/routes/meeting/scratchpad'
import { meetingShareRouter } from '#src/v1/routes/meeting/share'
import { meetingSummaryRouter } from '#src/v1/routes/meeting/summary'

const router = Router()

// Meeting list & capture routes
router.get('/upcoming', getMeetingsUpcomingController)
router.get('/completed', getMeetingsCompletedController)
router.post('/:meetingId/capture', postMeetingCaptureController)

router.use(meetingAssistantRouter)
router.use(meetingActionItemsRouter)
router.use(meetingHighlightsRouter)
router.use(meetingScratchpadRouter)
router.use(meetingShareRouter)
router.use(meetingSummaryRouter)
router.use(meetingPlaybackRouter)

export { router as meetingRouter }
