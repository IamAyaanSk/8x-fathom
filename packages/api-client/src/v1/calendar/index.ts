import {
  getCalendarStatusResponseSchema,
  postCalendarSyncResponseSchema
} from '@repo/api-contract/v1/calendar'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

async function getCalendarStatus(options: _HttpRequestOptions = {}) {
  const client = _getApiClient()
  const response = await client.get('/calendar/status', options)
  return getCalendarStatusResponseSchema.parse(response.data)
}

async function postCalendarSync(options: _HttpRequestOptions = {}) {
  const client = _getApiClient()
  const response = await client.post('/calendar/sync', undefined, options)
  return postCalendarSyncResponseSchema.parse(response.data)
}

export { getCalendarStatus, postCalendarSync }
