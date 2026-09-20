import { Router } from 'express'

import { patchMeetingActionItemController } from '#src/v1/controllers/meeting/action-items'

const router = Router()

router.patch(
  '/:meetingId/action-items/:actionItemId',
  patchMeetingActionItemController
)

export { router as meetingActionItemsRouter }
