# F1 — Implementation

Schema, pgvector, env, and catalog pins. No Better Auth routes, Calendar, MeetingBaas, or worker wiring.

## Steps

1. Pin upcoming packages in `pnpm-workspace.yaml` `catalog:` and add them to `apps/server` via `catalog:`.
2. Replace demo `User` / `Post` in `packages/database/prisma/schema.prisma` with:
   - Better Auth **core** tables: `user`, `session`, `account`, `verification` (all required columns + relations).
   - Domain: `CalendarWatch`, `CalendarEvent`, `Meeting`, `Highlight`, `ActionItem`, `TranscriptChunk`.
3. Enable pgvector; migration SQL uses `vector(1536)` for `TranscriptChunk.embedding`.
4. Load `DATABASE_URL` for Prisma CLI from `apps/server/.env` with `packages/database/.env` fallback.
5. Expand `apps/server` env Zod schema + `.env.example`; declare vars in `turbo.json` `globalEnv`.
6. Keep `GET /api/v1/users` compiling against Better Auth `user` (`name` is required).
7. Mark F1 done in `AGENTS.md`; document migrate/env in `README.md`.

## Files

| Path                                     | Change                                    |
| ---------------------------------------- | ----------------------------------------- |
| `packages/database/prisma/schema.prisma` | Domain + Better Auth core                 |
| `packages/database/prisma/migrations/*`  | Drop demo tables; pgvector                |
| `packages/database/prisma.config.ts`     | Env path                                  |
| `pnpm-workspace.yaml`                    | Catalog pins                              |
| `apps/server/package.json`               | Catalog deps + `@repo/shared-validations` |
| `apps/server/src/env.ts`                 | Full env schema                           |
| `apps/server/.env.example`               | Placeholders                              |
| `turbo.json`                             | `globalEnv`                               |
| `packages/api-contract/src/v1/users.ts`  | `name` not nullable                       |

## Acceptance

- `pnpm --filter @repo/db db:generate`
- Migration on pgvector Postgres; extension `vector` present
- `turbo check-types` / `pnpm lint` for touched packages
- App `package.json` versions are `catalog:`
