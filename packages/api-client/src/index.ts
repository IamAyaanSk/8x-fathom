import type { AxiosInstance } from 'axios'

export type _HttpRequestOptions = {
  signal?: AbortSignal
  timeout?: number
}

let client: AxiosInstance | null = null

function configureApiClient(instance: AxiosInstance) {
  if (!instance.defaults.baseURL) {
    throw new Error('Axios instance must have a baseURL configured.')
  }

  client = instance
}

function _getApiClient(): AxiosInstance {
  if (!client) {
    throw new Error(
      'API client has not been configured. Call configureApiClient() during application startup.'
    )
  }

  return client
}

export { configureApiClient, _getApiClient }
