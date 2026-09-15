# F1 — Decisions

## Better Auth core schema (required)

F1 includes the **minimum required** Better Auth tables, not a subset:

| Table (`@@map`) | Required fields                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`          | `id`, `name`, `email` (unique), `emailVerified`, `image?`, `createdAt`, `updatedAt`                                                                                                                  |
| `session`       | `id`, `expiresAt`, `token` (unique), `createdAt`, `updatedAt`, `ipAddress?`, `userAgent?`, `userId` (cascade)                                                                                        |
| `account`       | `id`, `accountId`, `providerId`, `userId` (cascade), `accessToken?`, `refreshToken?`, `idToken?`, `accessTokenExpiresAt?`, `refreshTokenExpiresAt?`, `scope?`, `password?`, `createdAt`, `updatedAt` |
| `verification`  | `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`                                                                                                                                   |

Better Auth generates string ids (no `@default` on auth tables). Domain tables use `@default(cuid())`. Plugin tables (2FA, org, JWKS) are out of scope until a plugin is added.

Auth is **not** mounted in F1. F2 adds `auth.ts` and can run `pnpm dlx @better-auth/cli generate` to confirm the core models.

## Table naming

Domain models use `@@map` to lowercase snake_case table names (`calendar_watch`, `calendar_event`, `meeting`, `highlight`, `scratchpad_entry`, `action_item`, `transcript_chunk`), consistent with Better Auth `user` / `session` / `account` / `verification`.

## Bot status

`Meeting.baasStatus` is the `BaasBotStatus` Prisma enum (MeetingBaas values). Nullable until the first status is known (`baasBotId` null → UI “Starting soon”). Persist unknown `MEET_LOGIN_*` API strings as `meet_login_error`.

## Scratchpad

Notes live in `ScratchpadEntry` (`meetingId`, `timestampSec`, `text`), unique per `(meetingId, timestampSec)` for debounced upsert at the current elapsed second.

## Embeddings

`TranscriptChunk.embedding` is `Unsupported("vector")`. SQL column is `vector(1536)` for OpenAI `text-embedding-3-small`. Similarity is `$queryRaw` in F9. No HNSW/IVFFlat index in F1.

## Env

Server startup validates all F2–F8 placeholders as non-empty strings so Turbo undeclared-env lint stays clean. Values in `.env.example` are dummies until those slices.

## Catalog

Pins live in `pnpm-workspace.yaml`. F1 installs them on `apps/server` only; web `better-auth` client is F2. Packages are not imported until their slice.

## Demo users API

`GET /api/v1/users` stays. Better Auth `user.name` is required `String`, so the contract drops `.nullable()`.

## Local Postgres

Developers run PostgreSQL locally with pgvector enabled (no repo `docker-compose`). Demo `User`/`Post` are dropped; empty hackathon DB assumed.
