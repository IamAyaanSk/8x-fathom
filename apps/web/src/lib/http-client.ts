import axios from 'axios'

import { resolvePublicOrigin } from '#lib/public-origin'

const axiosInstance = axios.create({
  baseURL: `${resolvePublicOrigin()}/api/v1`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

export { axiosInstance }
