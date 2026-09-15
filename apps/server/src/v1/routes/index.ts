import express from 'express'

import { getUsersController } from '#src/v1/controllers/users'
import { requireSession } from '#src/v1/middlewares/require-session'

const router = express.Router()

router.use(requireSession)
router.get('/users', getUsersController)

export default router
