import {
  getMeetingsUpcomingResponseSchema,
  type MeetingListItem
} from '@repo/api-contract/v1/meetings'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

export type { MeetingListItem }

async function getMeetingsUpcoming(options: _HttpRequestOptions = {}) {
  const client = _getApiClient()
  const response = await client.get('/meetings/upcoming', options)
  return getMeetingsUpcomingResponseSchema.parse(response.data)
}

export { getMeetingsUpcoming }
