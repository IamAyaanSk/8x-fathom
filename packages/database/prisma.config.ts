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

function _getPrismaCliDatabaseUrl(): string {
  const unpooled = process.env['DATABASE_URL_UNPOOLED']
  if (unpooled) {
    return unpooled
  }

  const pooled = process.env['DATABASE_URL']
  if (pooled) {
    return pooled
  }

  throw new Error(
    'Set DATABASE_URL_UNPOOLED (Neon direct) or DATABASE_URL in apps/server/.env for Prisma CLI.'
  )
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: _getPrismaCliDatabaseUrl()
  }
})
