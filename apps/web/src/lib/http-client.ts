import axios from 'axios'

import { env } from '#src/env'

const axiosInstance = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

export { axiosInstance }
