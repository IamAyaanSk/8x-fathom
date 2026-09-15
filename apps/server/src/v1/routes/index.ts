import express from 'express'

import {
  getCalendarStatusController,
  postCalendarSyncController
} from '#src/v1/controllers/calendar'
import { getMeetingsUpcomingController } from '#src/v1/controllers/meetings'
import { getUsersController } from '#src/v1/controllers/users'
import { requireSession } from '#src/v1/middlewares/require-session'

const router = express.Router()

router.use(requireSession)
router.get('/users', getUsersController)
router.get('/calendar/status', getCalendarStatusController)
router.post('/calendar/sync', postCalendarSyncController)
router.get('/meetings/upcoming', getMeetingsUpcomingController)

export default router
