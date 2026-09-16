# 8x fathom AI

Hackathon slice of [fathom.video](https://fathom.video): Google-only login, Calendar sync (Better Auth webhook endpoint + Sync now), auto-dispatch MeetingBaas recording bots, copy completed artifacts into R2, worker-generated summary/action items, playback + share. Q&A chatbot last.

See `AGENTS.md` for product rules, data model, bot status mapping, and the F0–F9 feature tracker.

## Database and env

Use [Neon](https://neon.com) PostgreSQL with **pgvector** (migrations run `CREATE EXTENSION IF NOT EXISTS vector`).

1. Create a Neon project and open **Connect** in the console.
2. Copy both connection strings ([Prisma + Neon guide](https://neon.com/docs/guides/prisma)):
   - **Pooled** (`-pooler` in the hostname) → `DATABASE_URL` on the API server and worker.
   - **Direct (unpooled)** → `DATABASE_URL_UNPOOLED` on the API server only (Prisma migrate / deploy / studio).
3. Optional: add `&connect_timeout=15` if the database was idle and the first connection times out.

Copy `apps/server/.env.example` to `apps/server/.env` and set those URLs. Prisma CLI loads `apps/server/.env` from `packages/database/prisma.config.ts` (optional `packages/database/.env` fallback). Runtime uses `@prisma/adapter-pg` with the **pooled** `DATABASE_URL`.

Copy `apps/web/.env.example` to `apps/web/.env`. Copy `apps/worker/.env.example` to `apps/worker/.env` and set the same `DATABASE_URL`, `MEETINGBAAS_API_KEY`, `MEETINGBAAS_WEBHOOK_SECRET`, and `BASE_URL` as the API server. Worker HTTP (health) defaults to port `3001`.

In local dev the Vite app proxies `/api` to Express (`http://localhost:3000`), so keep these aligned:

- `WEB_ORIGIN` and `BETTER_AUTH_URL` = `http://localhost:5173`
- `VITE_API_URL` = `http://localhost:5173`
- Google OAuth authorized redirect URI = `http://localhost:5173/api/auth/callback/google`

**Calendar webhooks:** Google `events.watch` needs a public HTTPS URL. Use ngrok (or similar), point `BETTER_AUTH_URL` and the browser at that origin, and add the ngrok callback URL to Google OAuth redirect URIs. See `docs/features/F3/DECISIONS.md`.

**MeetingBaas callbacks:** set `BASE_URL` on the API server (and worker) to a public origin. Register the **account webhook URL** in MeetingBaas as `{BASE_URL}/api/webhooks/meetingbaas` (required for `bot.status_change`; per-bot callbacks only send terminal events). Set `MEETINGBAAS_WEBHOOK_SECRET` to the Svix signing secret from the dashboard (with or without the `whsec_` prefix). Locally, the worker polls `getBotStatus` so list UI still updates without webhooks.

`pnpm dev` runs web, API, and shared package watchers (not the dispatch worker). Start the worker in a second terminal with `pnpm dev:worker`.

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
```

`db:migrate` is interactive (`prisma migrate dev`). Apply existing migrations with `pnpm --filter @repo/db db:deploy`.

## Tech Stack

| Layer           | Technology                                     |
| --------------- | ---------------------------------------------- |
| Monorepo        | Turborepo, pnpm workspaces                     |
| Web Frontend    | Vite 8, React 19, Tailwind CSS 4, shadcn/ui    |
| Routing (Web)   | TanStack Router (file-based, code-split)       |
| Data Fetching   | TanStack Query (React Query)                   |
| API Server      | Express 5, Better Auth, helmet, cors, morgan   |
| Auth            | Better Auth (Google OAuth + Calendar scopes)   |
| Meetings        | MeetingBaas Bot API v2 + Cloudflare R2         |
| AI              | Vercel AI SDK (worker; chat last)              |
| Database        | Prisma 7, PostgreSQL + pgvector                |
| Validation      | Zod 4                                          |
| Language        | TypeScript 6 (ESM, `NodeNext`)                 |
| Linting         | oxlint (with React, TS, import, Turbo plugins) |
| Formatting      | oxfmt (Tailwind class sorting, import sorting) |
| React Compiler  | babel-plugin-react-compiler                    |
| Package Manager | pnpm 11                                        |

---

## Project Structure

```
├── apps/
│   ├── web/                  # Vite + React web app
│   ├── server/               # Express API + Better Auth + bot dispatch
│   ├── worker/               # Express scheduler (DB lock + MeetingBaas dispatch)
│
├── packages/
│   ├── ui-web/               # shadcn/ui components + styles (shared UI library)
│   ├── api-contract/         # Zod schemas for API request/response types
│   ├── api-client/           # Axios-based API client + TanStack Query hooks
│   ├── database/             # Prisma schema, migrations, and client
│   ├── env/                  # Environment variable validation utilities
│   ├── shared-validations/   # Shared Zod schemas (used across apps & packages)
│   └── typescript-config/    # Shared base tsconfig
│
├── turbo.json                # Turborepo pipeline configuration
├── pnpm-workspace.yaml       # Workspace & pnpm catalog definitions
├── .oxlintrc.json            # oxlint configuration
├── .oxfmtrc.json             # oxfmt configuration
└── package.json              # Root scripts and devDependencies
```
