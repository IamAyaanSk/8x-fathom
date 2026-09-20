import { Router } from 'express'

import { postMeetingSummaryGenerateController } from '#src/v1/controllers/meeting/summary'

const router = Router()

router.post(
  '/:meetingId/summary/generate',
  postMeetingSummaryGenerateController
)

export { router as meetingSummaryRouter }
