import { Readable } from 'node:stream'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

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

async function putR2ObjectFromUrl(
  key: string,
  sourceUrl: string,
  timeoutMs: number
): Promise<void> {
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(timeoutMs)
  })

  if (!response.ok) {
    throw new Error(`Artifact download failed (${response.status})`)
  }

  if (!response.body) {
    throw new Error('Artifact download body is empty')
  }

  const contentType = response.headers.get('content-type') ?? undefined
  // Node fetch body is a web stream; SDK Upload expects a Node Readable.
  const body = Readable.fromWeb(
    response.body as import('node:stream/web').ReadableStream<Uint8Array>
  )

  const upload = new Upload({
    client: _getR2Client(),
    params: {
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ...(contentType ? { ContentType: contentType } : {})
    }
  })

  await upload.done()
}

export { getR2ObjectUtf8, putR2ObjectFromUrl }
