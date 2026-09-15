import { getUsersResponseSchema } from '@repo/api-contract/v1/users'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

async function getUsers(options: _HttpRequestOptions = {}) {
  const client = _getApiClient()

  const response = await client.get(`/users`, options)
  return getUsersResponseSchema.parse(response.data)
}

export { getUsers }
