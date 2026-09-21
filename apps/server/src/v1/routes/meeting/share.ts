import { Router } from 'express'

import { postMeetingShareEnableController } from '#src/v1/controllers/meeting/share'

const router = Router()

router.post('/:meetingId/share', postMeetingShareEnableController)

export { router as meetingShareRouter }
