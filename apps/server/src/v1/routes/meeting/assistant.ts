import { Router } from 'express'

import { postMeetingAssistantController } from '#src/v1/controllers/meeting/assistant'

const router = Router()

router.post('/assistant', postMeetingAssistantController)

export { router as meetingAssistantRouter }
