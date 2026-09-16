import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { EmbeddingModel, LanguageModel } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

// Use the Workers AI REST API directly. The AI Gateway response shape does not
// match what workers-ai-provider expects (embeddings miss `result`; chat misses
// OpenAI-style `choices`), which surfaces as "Cannot read properties of
// undefined (reading 'choices')".
const cloudflareAI = createWorkersAI({
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
    ? cloudflareAI.textEmbeddingModel('@cf/qwen/qwen3-embedding-0.6b')
    : lmstudio.embeddingModel('text-embedding-qwen3-embedding-0.6b')
