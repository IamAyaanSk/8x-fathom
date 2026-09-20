import express from 'express'

import {
  getCalendarStatusController,
  postCalendarSyncController
} from '#src/v1/controllers/calendar'
import {
  getMeetingShareDetailController,
  getMeetingShareTranscriptController,
  postMeetingShareEnableController
} from '#src/v1/controllers/meeting-share'
import { postMeetingSummaryGenerateController } from '#src/v1/controllers/meeting-summary'
import { patchMeetingActionItemController } from '#src/v1/controllers/meeting/action-items'
import { postMeetingAssistantController } from '#src/v1/controllers/meeting/assistant'
import {
  patchMeetingHighlightController,
  postMeetingHighlightController
} from '#src/v1/controllers/meeting/highlights'
import {
  getMeetingDetailController,
  getMeetingTranscriptController
} from '#src/v1/controllers/meeting/playback'
import { putMeetingScratchpadEntryController } from '#src/v1/controllers/meeting/scratchpad'
import {
  getMeetingsCompletedController,
  getMeetingsUpcomingController,
  postMeetingCaptureController
} from '#src/v1/controllers/meetings'
import { getUsersController } from '#src/v1/controllers/users'
import { requireSession } from '#src/v1/middlewares/require-session'

const router = express.Router()

router.get('/share/:shareSlug', getMeetingShareDetailController)
router.get('/share/:shareSlug/transcript', getMeetingShareTranscriptController)

router.use(requireSession)
router.get('/users', getUsersController)
router.get('/calendar/status', getCalendarStatusController)
router.post('/calendar/sync', postCalendarSyncController)
router.get('/meetings/upcoming', getMeetingsUpcomingController)
router.get('/meetings/completed', getMeetingsCompletedController)
router.post('/meetings/assistant', postMeetingAssistantController)
router.get('/meetings/:meetingId', getMeetingDetailController)
router.get('/meetings/:meetingId/transcript', getMeetingTranscriptController)
router.post('/meetings/:meetingId/share', postMeetingShareEnableController)
router.patch(
  '/meetings/:meetingId/action-items/:actionItemId',
  patchMeetingActionItemController
)
router.post('/meetings/:meetingId/highlights', postMeetingHighlightController)
router.patch(
  '/meetings/:meetingId/highlights/:highlightId',
  patchMeetingHighlightController
)
router.put(
  '/meetings/:meetingId/scratchpad',
  putMeetingScratchpadEntryController
)
router.post('/meetings/:meetingId/capture', postMeetingCaptureController)
router.post(
  '/meetings/:meetingId/summary/generate',
  postMeetingSummaryGenerateController
)

export default router
