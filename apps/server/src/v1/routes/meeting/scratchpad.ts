import { Router } from 'express'

import { putMeetingScratchpadEntryController } from '#src/v1/controllers/meeting/scratchpad'

const router = Router()

router.put('/:meetingId/scratchpad', putMeetingScratchpadEntryController)

export { router as meetingScratchpadRouter }
