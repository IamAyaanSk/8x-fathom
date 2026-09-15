import axios from 'axios'

import { env } from '#src/env'

const axiosInstance = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export { axiosInstance }
