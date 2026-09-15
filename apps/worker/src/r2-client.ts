import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { env } from '#src/env'

let _client: S3Client | undefined

function _getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
      }
    })
  }
  return _client
}

async function getR2ObjectUtf8(key: string): Promise<string> {
  const response = await _getR2Client().send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key
    })
  )

  if (!response.Body) {
    throw new Error('R2 object body is empty')
  }

  return response.Body.transformToString('utf-8')
}

export { getR2ObjectUtf8 }
