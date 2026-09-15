# Agent context — 8x fathom AI

Use this file for repo-wide architecture, boundaries, product domain, and workflows. Coding conventions in this file stay in force; product scope is below.

## Product — Fathom slice (hackathon)

Rebuild a **working** slice of [fathom.video](https://fathom.video): AI meeting notetaker. A smaller fully-wired path beats a half-wired larger one. Do not expand scope without flagging the tradeoff.

**Shipped path:** Google sign-in → connect Calendar scopes → store upcoming events → auto-dispatch a MeetingBaas **bot** at `event.startTime - 1–2 min` → MeetingBaas callback into **our** R2 (BYO storage) → worker summary / action items / embeddings → library playback + share → ongoing-call tab (status, highlight, scratchpad) → **Q&A chatbot last.**

**Auth:** Google-only (no email/password). Calendar is incremental Google scopes (`calendar.events.readonly` / watch-capable readonly) via `linkSocial` after login.

**Out of scope:** MeetingBaas calendar-connection APIs; live/partial transcript; manual “start capture”; a jobs/queue table; extra surfaces beyond the list below.

### Frontend surfaces (build order)

1. Auth + Connect Calendar
2. Events / meetings list (upcoming + processed past)
3. Meeting detail / playback — **highest UX leverage** (video, synced transcript, summary, timestamped action items, highlight markers, share via `shareSlug`); depends on F5 bot dispatch + F7 ingest/AI
4. Ongoing call tab — highlight + scratchpad (entire live-capture UX; **F6**, second-to-last slice)
5. Q&A chatbot — RAG over `TranscriptChunk` embeddings (Vercel AI SDK) — **last**

Routes (file-based): `/login`, `/` (list), `/meetings/$id` (tabs: Ongoing | Recording), `/share/$shareSlug` (public).

### Bot dispatch & status

- Bots are dispatched **automatically** by the worker scheduler. No start-capture button.
- Calendar sync only creates/updates `Meeting` rows for events with a `meetingUrl` (Meet / Zoom / Teams).
- Store MeetingBaas bot status on `Meeting.baasStatus` as the `BaasBotStatus` enum (same strings as the v2 API `status` field). Derive UI from one shared mapper in `packages/api-contract` (imported by server and web).

| UI state               | MeetingBaas `baasStatus`                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Starting soon          | Our pre-`createBot` state (`baasBotId` null)                                                                                |
| Joining…               | `queued`, `pickup_delayed`, `joining_call`, `in_waiting_room`, `in_waiting_for_host`                                        |
| In call — recording    | `in_call_recording`, `recording_resumed`, `in_call_not_recording`                                                           |
| Call ended, processing | `call_ended`, `recording_succeeded`, `transcribing`                                                                         |
| Ready                  | `completed`                                                                                                                 |
| Failed to join         | `bot_rejected`, `invalid_meeting_url`, `meeting_error`, `waiting_room_timeout`, `bot_removed_too_early`, `bot_removed`, `MEET_LOGIN_*` |
| Failed processing      | `failed`, `transcription_failed`, `recording_failed`                                                                        |

**Ongoing call:** active once `createBot` has been called. Poll `GET /bots/{id}/status` every ~5–10s in Joining…; ~60s in In call. Distinct honest labels — never a blank spinner. Failures shown immediately. No live transcript — show elapsed recording time. Highlight click writes `{ meetingId, timestampSec, note? }`. Scratchpad: upsert `ScratchpadEntry` at `{ meetingId, timestampSec, text }` (debounced).

### Integrations

- **Better Auth** on Express: mount `toNodeHandler(auth)` at `/api/auth/*splat` (**Express 5**) **before** `express.json()`. Prisma adapter against `@repo/db`. `accessType: 'offline'` + consent so we keep a refresh token. Use `auth.api.getAccessToken({ providerId: 'google' })` for Calendar API calls. Docs: [Express](https://better-auth.com/docs/integrations/express), [Google](https://better-auth.com/docs/authentication/google), [Prisma](https://better-auth.com/docs/adapters/prisma), [extra scopes](https://better-auth.com/docs/concepts/oauth). Prefer Better Auth MCP when available.
- **Calendar webhooks via Better Auth:** register an inbound webhook as a Better Auth **plugin endpoint** (`createAuthEndpoint`, e.g. `/calendar/webhook` under `/api/auth`). After Calendar scopes are granted, call Google Calendar `events.watch` with `address` = that Better Auth URL. On ping, incremental `events.list` with `syncToken`. Also support **Sync now** and sync on list page load (needed locally without a public HTTPS URL). Do **not** use MeetingBaas calendar webhooks.
- **MeetingBaas v2 Bot API only** (`@meeting-baas/sdk`, `api_version: 'v2'`): `createBot`, `getBotStatus`. Per-bot `callback_config` to our public URL; `extra.meetingId` for correlation; transcription on. Verify inbound webhooks with Svix (`svix-id`, `svix-timestamp`, `svix-signature`) and `MEETINGBAAS_WEBHOOK_SECRET`. [BYO storage](https://docs.meetingbaas.com/bring-your-own-storage) configured once (dashboard or `PUT /v2/storage-config`) to **our R2**. R2 CORS must allow **our** web origin (GET/HEAD). Playback via `@aws-sdk/client-s3` + presigner.
- **AI:** Vercel AI SDK in `apps/worker` after artifacts exist. Chat is F9.
- **Worker:** `apps/worker` — separate Express process/deploy. Cron scheduler reads PostgreSQL (`FOR UPDATE SKIP LOCKED`) and calls MeetingBaas `createBot` directly (`@repo/meeting-dispatch`). Capture API on the server uses the same package. Later slices poll `Meeting.processingStatus` (no jobs table).

### Data model (Prisma)

Replace demo `User` / `Post`. Enable `CREATE EXTENSION vector`. Better Auth core tables (`user`, `session`, `account`, `verification`) via generate + adapter.

- `CalendarWatch` — per user: `channelId`, `resourceId`, `expiration`, `syncToken`
- `Meeting` — `userId`, `googleEventId` (unique), title, start/end, `meetingUrl`, `htmlLink`, `baasBotId`, `baasStatus` (`BaasBotStatus` enum, nullable pre-dispatch), `processingStatus` (`idle` \| `pending` \| `processing` \| `ready` \| `failed`), `shareSlug`, R2 keys, `recordingStartedAt`, summary fields (`@@map("meeting")`). Rows are upserted from calendar sync only when the Google event is in the sync window and has a meeting URL; cancel / loss of URL deletes pre-dispatch rows (`baasBotId` null).
- `ScratchpadEntry` — `meetingId`, `timestampSec`, `text` (unique per meeting + timestamp; debounced upsert in F6)
- `Highlight` — `meetingId`, `timestampSec`, `note?`
- `ActionItem` — `meetingId`, `text`, `timestampSec?`
- `TranscriptChunk` — `meetingId`, times, `speaker?`, `text`, `embedding` (`Unsupported("vector")`; similarity via `$queryRaw`)

### Feature tracker

Implement **one slice per task**. Mark done in this list when the vertical slice works.

**Priority after F4:** table order below (not numeric ID order). Ship bot join (F5) and post-processing (F7) before live-call UX; **F6 is second-to-last** (before F9).

| ID  | Slice                                                               | Status      |
| --- | ------------------------------------------------------------------- | ----------- |
| F0  | Context files (this document + cursor rules + README)               | done        |
| F1  | Schema, pgvector, env, catalog deps                                 | done        |
| F2  | Google auth, sessions, protected API                                | done        |
| F3  | Calendar connect, list/store events, Better Auth webhook + Sync now | done        |
| F4  | Events / library list UI                                            | done        |
| F5  | Worker dispatch `createBot` at start − buffer                       | done        |
| F7  | Baas callback, worker AI, `processingStatus: ready`                 | not started |
| F8  | Playback + transcript sync + share                                  | not started |
| F6  | Ongoing call: status poll, highlight, scratchpad                    | not started |
| F9  | Q&A RAG chatbot                                                     | not started |

## Monorepo

- **Tooling**: Turborepo + pnpm workspaces (`catalogMode: prefer` — use `catalog:` for shared dependency versions in `pnpm-workspace.yaml`).
- **Node**: `>=22`. **ESM** everywhere (`"type": "module"`, TypeScript `module` / `moduleResolution`: `NodeNext`).
- **Root scripts**: `pnpm dev` (web + API; excludes worker), `pnpm dev:worker` (dispatch scheduler), `pnpm build`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm format:fix`.
- **Turbo env**: `DATABASE_URL` and `NODE_ENV` are `globalEnv`. New env vars used in tasks must be declared in `turbo.json` (oxlint `turbo/no-undeclared-env-vars`).

## Layout

| Path                             | Role                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web`                       | Vite 8, React 19, TanStack Router (file routes), TanStack Query                |
| `apps/server`                    | Express 5 API at `/api/v1`; Better Auth at `/api/auth`; bot dispatch + capture |
| `apps/worker`                    | Express scheduler; DB row-lock dispatch via `@repo/meeting-dispatch`           |
| `packages/meeting-dispatch`      | MeetingBaas `createBot` + `FOR UPDATE SKIP LOCKED` dispatch                    |
| `packages/api-contract`          | Zod schemas + inferred types for API payloads                                  |
| `packages/api-client`            | Axios calls + TanStack Query `queryOptions` / hooks                            |
| `packages/database` (`@repo/db`) | Prisma 7 + PostgreSQL (`PrismaPg` adapter)                                     |
| `packages/env`                   | `unsafeValidateEnv` + `NODE_ENV` helpers                                       |
| `packages/shared-validations`    | Reusable Zod field schemas                                                     |
| `packages/ui-web`                | shadcn/ui-style components + `globals.css`                                     |
| `packages/typescript-config`     | Shared `base.json` tsconfig                                                    |

## Package boundaries

Respect dependency direction:

```
shared-validations → api-contract → api-client → apps/web
@repo/db → apps/server, apps/worker
@repo/env → apps/*
@repo/api-contract → apps/server, apps/worker, packages/api-client, packages/meeting-dispatch
@repo/meeting-dispatch → apps/server, apps/worker
@repo/ui-web → apps/web
```

- **Do not** import `apps/*` from `packages/*`.
- **Do not** put Prisma or Express handlers in the web app; go through `api-client`.
- **Do not** duplicate API response shapes; define them once in `api-contract`.

## API design (contract → server → client → UI)

### 1. `packages/api-contract`

- Import Zod from `zod/v4`.
- Reuse fields from `@repo/shared-validations` where possible.
- Wrap success payloads with `_createResponseApiZod` (`packages/api-contract/src/utils.ts`) so responses are `{ message, success: true, data }` or `{ message, success: false }`.
- Export: schema, `GetXxxResponse`, and `GetXxxSuccessResponse` (`Extract<..., { success: true }>`) for controllers.

### 2. `apps/server`

- Mount versioned routes under `src/v1/routes/`; wire in `src/v1/routes/index.ts`.
- Controllers live in `src/v1/controllers/` as named async functions (`getUsersController`), typed `Response<SuccessType>`, errors via `next(error)`.
- Use `prisma` from `@repo/db` only in controllers/services — not in contract or client packages.
- Validate env in `src/env.ts` with `unsafeValidateEnv` from `@repo/env` (load `.env` via `loadEnvFile()` on server).
- Internal imports: `#src/*` (see `package.json` `imports`).

### 3. `packages/api-client`

- One module per resource under `src/v1/<resource>/index.ts`: call `_getApiClient()`, `parse` response with the contract schema.
- Colocate React Query in `hooks.ts`: `queryOptions`, `useXxxQuery`, and `xxxQueryKeys` objects.
- App must call `configureApiClient(axiosInstance)` once at startup (`apps/web/src/main.tsx`).

### 4. `apps/web`

- File-based routes in `src/routes/`; generated `routeTree.gen.ts` is lint-ignored — do not hand-edit.
- Route files export only `Route` (config); page/layout components live under `src/components/` (`pages/`, `layout/`, feature folders) so Fast Refresh works.
- Prefer route `loader` + `queryClient.ensureQueryData(...)` for prefetch; use hooks in components.
- Path aliases: `#src/*`, `#lib/*`, `#components/*`, `#hooks/*`.
- UI: import from `@repo/ui-web`; global styles via `@repo/ui-web/globals.css`.
- **Theming**: use only semantic tokens defined in `packages/ui-web/src/styles/globals.css` (`background`, `foreground`, `primary`, `muted`, `border`, `destructive`, sidebar/chart, radius, etc.) via their Tailwind utilities (`bg-background`, `text-muted-foreground`, …). Do not use random default-palette or arbitrary color classes; add new tokens in `globals.css` if the design system needs them.
- React Compiler is enabled; use standard React 19 patterns (functional components, hooks).

## Code conventions (strict)

These are non-negotiable unless the user explicitly overrides them in the task.

### Types

- **No `any`**. Use `unknown` and narrow, generics, `z.infer`, Prisma-generated types, or `Extract` / discriminated unions. Never use `any` to silence the compiler.
- **Better types over casts**. Prefer schema-driven types (`api-contract`, `shared-validations`) and inference. Avoid `as` unless unavoidable; document why in a short comment if you must.
- **No duplicated types or validation**. One source of truth: shared fields in `shared-validations`, API shapes in `api-contract`, DB shapes from Prisma. Do not copy the same Zod object or interface in two packages.

### Logic and state

- **Simple, straight logic**. Prefer early returns and linear flow. No nested ternaries, “clever” one-liners, or extra indirection unless the codebase already uses that pattern nearby.
- **Minimal state**. Derive values instead of storing them. In React, prefer TanStack Query / router loaders for server data; avoid redundant `useState` + `useEffect` sync. Do not add state for things already in context, URL, or query cache.

### Packages and responsibility

- **One duty per package**. Each package has a single clear role (see Layout). If code does not fit that role, move it to the right package or ask before blurring boundaries.
- **Logical placement**. Example: HTTP + parsing → `api-client`; shapes only → `api-contract`; DB access → server + `@repo/db`; UI primitives → `ui-web`.

### When unsure

- If you are **less than ~90% sure** about requirements, API shape, package ownership, or a breaking change, **ask the user** before implementing. Do not guess and build the wrong layer.

## TypeScript & style

- Extend `@repo/typescript-config/base.json`: `strict`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`.
- Use `import type` for type-only imports.
- Prefer **named exports** (`export { fn }`).
- Private module helpers: `_prefix` (e.g. `_getApiClient`, `_createResponseApiZod`).
- Formatting: **oxfmt** — no semicolons, single quotes, no trailing commas, sorted imports and Tailwind classes.
- Lint: **oxlint** at repo root; fix with `pnpm lint:fix` when appropriate.

## Database

- Schema and migrations in `packages/database`.
- Scripts: `db:generate`, `db:migrate`, `db:deploy`, `db:studio` (Turbo tasks; `dev`/`build` depend on `^db:generate`).
- Client singleton in `packages/database/src/client.ts` with dev global caching.

## Adding a new read/write API (checklist)

1. Add or extend Zod schemas in `packages/shared-validations` if fields are reusable.
2. Add contract in `packages/api-contract/src/v1/<resource>.ts`.
3. Implement controller + route on server under `v1`.
4. Add client function + hooks in `packages/api-client`.
5. Consume from a TanStack Router route or component in `apps/web`.
6. Run `check-types` / `build` for affected packages.

## What to avoid

- `any`, duplicated schemas/types, and type assertions used to avoid proper modeling.
- Extra local state, duplicated server data, or over-abstracted control flow.
- Hardcoded Tailwind colors (palette grays/blues, arbitrary `bg-[…]` / `text-[…]`) instead of `globals.css` theme tokens.
- Putting logic in the wrong package “for convenience.”
- Committing secrets or bypassing env validation.
- Editing `**/routeTree.gen.ts`.
- Adding dependencies without using the pnpm catalog when the package is already cataloged.
- Large cross-layer refactors when a minimal vertical slice (contract → server → client → route) is enough.
