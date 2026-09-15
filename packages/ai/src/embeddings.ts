import { embed, type Embedding, type EmbeddingModelUsage } from 'ai'

import { embeddingModel } from './model.js'

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
