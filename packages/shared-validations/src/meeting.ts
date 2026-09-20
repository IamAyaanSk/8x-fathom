import { z } from 'zod/v4'

const meetingBaasTranscriptWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number().optional()
})

const meetingBaasTranscriptUtteranceSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  confidence: z.number().optional(),
  channel: z.number().optional(),
  words: z.array(meetingBaasTranscriptWordSchema).optional(),
  speaker: z.string().optional()
})

const meetingBaasOutputTranscriptionSchema = z.object({
  bot_id: z.string(),
  provider: z.string().optional(),
  result: z.object({
    utterances: z.array(meetingBaasTranscriptUtteranceSchema),
    languages: z.array(z.string()).optional(),
    total_utterances: z.number().optional(),
    total_duration: z.number().optional()
  }),
  created_at: z.string().optional()
})

type MeetingBaasOutputTranscription = z.infer<
  typeof meetingBaasOutputTranscriptionSchema
>

type MeetingBaasTranscriptUtterance = z.infer<
  typeof meetingBaasTranscriptUtteranceSchema
>

export {
  meetingBaasOutputTranscriptionSchema,
  meetingBaasTranscriptUtteranceSchema,
  meetingBaasTranscriptWordSchema,
  type MeetingBaasOutputTranscription,
  type MeetingBaasTranscriptUtterance
}
