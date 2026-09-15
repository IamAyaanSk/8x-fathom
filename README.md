# 8x fathom AI

Hackathon slice of [fathom.video](https://fathom.video): Google-only login, Calendar sync (Better Auth webhook endpoint + Sync now), auto-dispatch MeetingBaas recording bots, R2 (BYO storage), worker-generated summary/action items, playback + share. Q&A chatbot last.

See `AGENTS.md` for product rules, data model, bot status mapping, and the F0–F9 feature tracker.

## Database and env

Use a local PostgreSQL instance with the **pgvector** extension (`CREATE EXTENSION vector`).

Copy `apps/server/.env.example` to `apps/server/.env` and set `DATABASE_URL`. Prisma CLI loads that file from `packages/database/prisma.config.ts` (optional `packages/database/.env` fallback).

Copy `apps/web/.env.example` to `apps/web/.env`. In local dev the Vite app proxies `/api` to Express (`http://localhost:3000`), so keep these aligned:

- `WEB_ORIGIN` and `BETTER_AUTH_URL` = `http://localhost:5173`
- `VITE_API_URL` = `http://localhost:5173`
- Google OAuth authorized redirect URI = `http://localhost:5173/api/auth/callback/google`

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
│   ├── server/               # Express API + Better Auth; worker in src/worker.ts
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
