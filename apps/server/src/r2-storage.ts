import { createR2Storage } from '@repo/r2'

import { env } from '#src/env'

const { getR2ObjectUtf8, presignR2GetObjectUrl } = createR2Storage({
  endpoint: env.R2_ENDPOINT,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucket: env.R2_BUCKET
})

export { getR2ObjectUtf8, presignR2GetObjectUrl }
