import { embed, type Embedding, type EmbeddingModelUsage } from 'ai'

import { embeddingModel } from './model.js'

export const TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS = 1024

export async function generateEmbedding(query: string): Promise<{
  embedding: Embedding
  tokenUsage: EmbeddingModelUsage
}> {
  const input = query.replaceAll('\n', ' ')
  const { embedding, usage } = await embed({
    model: embeddingModel,
    value: input
  })

  return {
    embedding,
    tokenUsage: usage
  }
}

export async function generateEmbeddings(values: string[]): Promise<{
  embeddings: Embedding[]
  tokenUsage: EmbeddingModelUsage
}> {
  if (values.length === 0) {
    return {
      embeddings: [],
      tokenUsage: { tokens: 0 }
    }
  }

  const embeddings: Embedding[] = []
  let totalTokens = 0

  for (const value of values) {
    const { embedding, tokenUsage } = await generateEmbedding(value)
    embeddings.push(embedding)
    totalTokens += tokenUsage.tokens
  }

  return {
    embeddings,
    tokenUsage: { tokens: totalTokens }
  }
}

export function embeddingToPgVectorLiteral(embedding: readonly number[]) {
  if (embedding.length !== TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS) {
    throw new Error(
      `Expected embedding length ${TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS}, received ${embedding.length}`
    )
  }

  for (const value of embedding) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('Embedding contains a non-finite number')
    }
  }

  return `[${embedding.join(',')}]`
}
