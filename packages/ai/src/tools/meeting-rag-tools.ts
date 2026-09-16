import { tool, type Tool } from 'ai'
import { z } from 'zod/v4'

const DEFAULT_TOP_K = 8
const MAX_TOP_K = 12

const meetingRagSearchInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .describe('Search query derived from the user question.'),
  topK: z
    .number()
    .int()
    .min(1)
    .max(MAX_TOP_K)
    .optional()
    .describe('Maximum number of transcript snippets to return.')
})

const meetingRagSnippetSchema = z.object({
  meetingTitle: z.string(),
  startSec: z.number().int().nonnegative(),
  endSec: z.number().int().nonnegative(),
  speaker: z.string().nullable(),
  excerpt: z.string()
})

const meetingRagSearchResultSchema = z.object({
  snippets: z.array(meetingRagSnippetSchema)
})

type MeetingRagSearchInput = z.infer<typeof meetingRagSearchInputSchema>
type MeetingRagSearchResult = z.infer<typeof meetingRagSearchResultSchema>

type MeetingRagSearchDeps = {
  searchAllMeetBase: (
    input: MeetingRagSearchInput
  ) => Promise<MeetingRagSearchResult>
}

type MeetingRagTool = Tool<MeetingRagSearchInput, MeetingRagSearchResult>
type MeetingRagTools = {
  searchAllMeetBase: MeetingRagTool
}

function _withDefaultTopK(input: MeetingRagSearchInput): MeetingRagSearchInput {
  return {
    query: input.query,
    topK: input.topK ?? DEFAULT_TOP_K
  }
}

function createMeetingRagTools(deps: MeetingRagSearchDeps): MeetingRagTools {
  const searchAllMeetBase = tool({
    description:
      'Search transcripts across the user processed meetings for passages relevant to the question. Call this before any factual answer about meeting content.',
    inputSchema: meetingRagSearchInputSchema,
    execute: async (input) => deps.searchAllMeetBase(_withDefaultTopK(input))
  })

  return {
    searchAllMeetBase
  }
}

export {
  createMeetingRagTools,
  DEFAULT_TOP_K,
  MAX_TOP_K,
  meetingRagSearchInputSchema,
  meetingRagSearchResultSchema,
  meetingRagSnippetSchema
}
export type {
  MeetingRagSearchDeps,
  MeetingRagSearchInput,
  MeetingRagSearchResult,
  MeetingRagTools
}
