import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

const packageEnvPath = resolve(import.meta.dirname, '.env')
const serverEnvPath = resolve(import.meta.dirname, '../../apps/server/.env')

if (existsSync(packageEnvPath)) {
  config({ path: packageEnvPath })
}

config({ path: serverEnvPath, override: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: process.env['DATABASE_URL']
  }
})
