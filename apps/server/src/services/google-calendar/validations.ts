import { z } from 'zod'

export const GoogleCalendarWatchResponseSchema = z
  .object({
    resourceId: z.string().min(1),
    expiration: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => new Date(Number(value)))
  })
  .loose()

export const GoogleEventStatusSchema = z.enum([
  'confirmed',
  'tentative',
  'cancelled'
])

export const GoogleCalendarEventSchema = z
  .object({
    id: z.string().min(1, 'Event ID is required'),
    status: GoogleEventStatusSchema.optional().default('confirmed'),
    summary: z.string().nullish(),
    htmlLink: z.url().nullish(),
    start: z.object({
      dateTime: z.iso
        .datetime({ offset: true })
        .transform((value) => new Date(value))
    }),
    end: z.object({
      dateTime: z.iso
        .datetime({ offset: true })
        .transform((value) => new Date(value))
    })
  })
  .loose()
