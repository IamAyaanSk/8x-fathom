import { Readable } from 'node:stream'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type R2StorageConfig = {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

type R2Storage = {
  getR2ObjectUtf8: (key: string) => Promise<string>
  presignR2GetObjectUrl: (
    key: string,
    expiresInSeconds: number
  ) => Promise<string>
  putR2ObjectFromUrl: (
    key: string,
    sourceUrl: string,
    timeoutMs: number
  ) => Promise<void>
}

function createR2Storage(config: R2StorageConfig): R2Storage {
  let client: S3Client | undefined

  function _getR2Client(): S3Client {
    if (!client) {
      client = new S3Client({
        region: 'auto',
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey
        }
      })
    }
    return client
  }

  async function presignR2GetObjectUrl(
    key: string,
    expiresInSeconds: number
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    })
    return getSignedUrl(_getR2Client(), command, {
      expiresIn: expiresInSeconds
    })
  }

  async function getR2ObjectUtf8(key: string): Promise<string> {
    const response = await _getR2Client().send(
      new GetObjectCommand({
        Bucket: config.bucket,
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
    const body = Readable.fromWeb(
      response.body as import('node:stream/web').ReadableStream<Uint8Array>
    )

    const upload = new Upload({
      client: _getR2Client(),
      params: {
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ...(contentType ? { ContentType: contentType } : {})
      }
    })

    await upload.done()
  }

  return { getR2ObjectUtf8, presignR2GetObjectUrl, putR2ObjectFromUrl }
}

export { createR2Storage, type R2Storage, type R2StorageConfig }
