import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { EmbeddingModel, LanguageModel } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

const cloudflareAI = createWorkersAI({
  apiKey: `${process.env.CLOUDFLARE_API_TOKEN}`,
  gateway: {
    id: `${process.env.CLOUDFLARE_API_GATEWAY}`
  },
  accountId: `${process.env.CLOUDFLARE_ACCOUNT_ID}`
})

// Separate instance without gateway for embeddings — the gateway endpoint
// returns a different response shape that workers-ai-provider doesn't handle
// correctly for embedding calls (missing `result` wrapper).
const cloudflareAIDirect = createWorkersAI({
  apiKey: `${process.env.CLOUDFLARE_API_TOKEN}`,
  accountId: `${process.env.CLOUDFLARE_ACCOUNT_ID}`
})

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: process.env.LM_STUDIO_BASE_URL!,
  apiKey: process.env.LM_STUDIO_API_KEY!
})

export const llmModel: LanguageModel =
  process.env.NODE_ENV === 'production'
    ? cloudflareAI('@cf/zai-org/glm-4.7-flash')
    : lmstudio('nvidia/nemotron-3-nano-4b')

export const embeddingModel: EmbeddingModel =
  process.env.NODE_ENV === 'production'
    ? cloudflareAIDirect.textEmbeddingModel('@cf/qwen/qwen3-embedding-0.6b')
    : lmstudio.embeddingModel('text-embedding-qwen3-embedding-0.6b')
