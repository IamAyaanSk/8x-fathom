# ⚡ Turbo Stack

A production-ready monorepo template for building full-stack applications with **Web**, **Mobile**, and **API** all sharing code from a single repository.

Built with [Turborepo](https://turbo.build/repo), [React](https://react.dev), [Expo](https://expo.dev), [Express](https://expressjs.com), [Prisma](https://www.prisma.io), and [TypeScript](https://www.typescriptlang.org).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Apps](#apps)
- [Packages](#packages)
- [Dependency Management](#dependency-management)
- [Shadcn UI](#shadcn-ui)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Linting & Formatting](#linting--formatting)
- [Conventions](#conventions)

---

## Overview

Turbo Stack gives you a batteries-included monorepo with:

- A **Vite + React** web app with file-based routing (TanStack Router) and TanStack Query
- An **Expo** mobile app ready for iOS and Android
- An **Express** API server with versioned routes, structured middleware, and Zod-validated env
- A **Prisma + PostgreSQL** database package with generated client
- Shared packages for **UI components**, **API contracts**, **API client with hooks**, **environment validation**, and **Zod schemas**
- All packages compiled to **ESM** with **TypeScript 6** and **NodeNext** module resolution
- **oxlint** + **oxfmt** for blazing-fast linting and formatting
- **pnpm catalogs** for single-source dependency versioning across the monorepo

---

## Tech Stack

| Layer           | Technology                                     |
| --------------- | ---------------------------------------------- |
| Monorepo        | Turborepo, pnpm workspaces                     |
| Web Frontend    | Vite 8, React 19, Tailwind CSS 4, shadcn/ui    |
| Routing (Web)   | TanStack Router (file-based, code-split)       |
| Data Fetching   | TanStack Query (React Query)                   |
| Mobile          | Expo 57, React Native, Expo Router             |
| API Server      | Express 5, helmet, cors, morgan                |
| Database        | Prisma 7, PostgreSQL (via `pg` driver adapter) |
| Validation      | Zod 4                                          |
| Language        | TypeScript 6 (ESM, `NodeNext`)                 |
| Linting         | oxlint (with React, TS, import, Turbo plugins) |
| Formatting      | oxfmt (Tailwind class sorting, import sorting) |
| React Compiler  | babel-plugin-react-compiler                    |
| Package Manager | pnpm 11                                        |

---

## Project Structure

```
turbo-stack/
├── apps/
│   ├── web/                  # Vite + React web app
│   ├── server/               # Express API server
│   └── mobile/               # Expo React Native app
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

---

## Prerequisites

| Requirement    | Version            |
| -------------- | ------------------ |
| **Node.js**    | >= 22              |
| **pnpm**       | 11 (via corepack)  |
| **PostgreSQL** | Any recent version |

Enable corepack (ships with Node.js) so pnpm is automatically managed:

```bash
corepack enable
```

---

## Getting Started

### 1. Clone the template

```bash
# Using GitHub template (recommended)
# Click "Use this template" on GitHub, then clone your new repo.

# Or clone directly
git clone https://github.com/IamAyaanSk/turbo-stack.git my-app
cd my-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create `.env` files for the apps that need them:

**`apps/server/.env`** (copy from `.env.example`):

```bash
cp apps/server/.env.example apps/server/.env
```

```env
PORT='3000'
NODE_ENV='development'
DATABASE_URL="postgres://user:password@localhost:5432/db-name"
```

**`apps/web/.env`**:

```env
VITE_API_URL="http://localhost:3000/api/v1"
```

**`packages/database/.env`**:

```env
DATABASE_URL="postgres://user:password@localhost:5432/db-name"
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm turbo db:generate

# Run migrations (creates/updates tables)
pnpm turbo db:migrate
```

### 5. Start development

```bash
pnpm dev
```

This starts **all apps** concurrently via Turborepo:

- **Web** → `http://localhost:5173` (Vite dev server)
- **Server** → `http://localhost:3000` (Express with tsx watch)
- **Mobile** → Expo dev server (scan QR with Expo Go, or press `i`/`a` for simulators)

> Compiled packages (`api-contract`, `api-client`, `env`, `shared-validations`, `database`) run `tsc --watch` in dev mode so changes propagate instantly.

---

## Available Scripts

All scripts can be run from the root via Turborepo: (Make sure you install turbo globally for better developer experience)

### Root-Level

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `turbo run dev`        | Start all apps and packages in dev mode    |
| `turbo run build`      | Build all apps and packages for production |
| `turbo run lint`       | Lint the entire monorepo with oxlint       |
| `turbo run lint:fix`   | Auto-fix lint issues                       |
| `turbo run format`     | Check formatting with oxfmt                |
| `turbo run format:fix` | Auto-fix formatting (runs after lint:fix)  |

### Turborepo Tasks

| Command                 | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `turbo run db:generate` | Generate Prisma client                                                |
| `turbo run db:migrate`  | Run Prisma migrations (dev)                                           |
| `turbo run db:deploy`   | Deploy Prisma migrations (production)                                 |
| `turbo run db:studio`   | Open Prisma Studio GUI                                                |
| `turbo run check-types` | Type-check all packages                                               |
| `turbo run ios`         | Run the mobile app on iOS simulator (needs setup as per expo docs)    |
| `turbo run android`     | Run the mobile app on Android emulator (needs setup as per expo docs) |

### Per-App

You can also run scripts for individual apps:

```bash
# Run only the web app
turbo run --filter web dev

# Run only the server
turbo run --filter server dev

# Build only the server
turbo run --filter server build

# Start the server in production
turbo run --filter server start

# Run mobile on iOS
turbo run --filter mobile ios
```

---

## Apps

### `apps/web` — Web Application

A **Vite 8 + React 19** SPA with:

- **TanStack Router** — file-based routing with automatic code-splitting (`src/routes/`)
- **TanStack Query** — data fetching with devtools
- **Tailwind CSS 4** — utility-first styling via Vite plugin
- **shadcn/ui** — UI components installed into the shared `@repo/ui-web` package
- **React Compiler** — automatic memoization via babel plugin
- **Zod-validated environment** — fails fast on missing `VITE_API_URL`
- **Node.js subpath imports** (`#components/*`, `#lib/*`, `#hooks/*`, `#src/*`)

### `apps/server` — API Server

An **Express 5** server with:

- **Versioned API routes** — `v1/` structure with controllers, routes, and middlewares
- **Security** — helmet, CORS, cookie-parser
- **Logging** — morgan (dev format in development, combined in production)
- **Zod-validated environment** — validates `PORT`, `NODE_ENV`, `DATABASE_URL` at startup
- **Prisma** — uses the shared `@repo/db` package for database access
- **Hot reload** — `tsx watch` with `--conditions=development` for Node.js subpath import conditions
- **Health check** — `GET /health`

### `apps/mobile` — Mobile Application

An **Expo 57** app with:

- **Expo Router** — file-based routing for React Native
- **Shared packages** — uses `@repo/api-client`, `@repo/shared-validations`, `@repo/env`
- **React Native** 0.86 with Reanimated, Gesture Handler, Safe Area, Screens
- **iOS and Android** — run on simulators/devices via `expo run:ios` / `expo run:android`

---

## Packages

All internal packages use the `@repo/` scope and are linked via `workspace:*`.

### `@repo/ui-web` — Shared UI Components

The **shadcn/ui** component library for the web app:

- Components are installed here, not in `apps/web`
- Exports `globals.css`, `components/*`, `lib/*`, `hooks/*`
- Uses Tailwind CSS 4, `class-variance-authority`, `clsx`, `tailwind-merge`
- Includes font packages: Inter, Geist, DM Sans, Outfit
- Has its own `components.json` for the shadcn CLI

### `@repo/api-contract` — API Contract

Type-safe API definitions shared between client and server:

- Zod schemas defining request/response shapes
- Versioned exports (`./v1/*`)
- Compiled to ESM — consumed by both `api-client` and `server`

### `@repo/api-client` — API Client

A configurable Axios-based HTTP client with TanStack Query integration:

- `configureApiClient()` — initialize with an Axios instance at app startup
- Versioned fetch functions and query hooks (`./v1/*`)
- Used by both `web` and `mobile` apps

### `@repo/db` — Database

Prisma-based database package:

- `prisma/schema.prisma` — your data model (PostgreSQL)
- Uses Prisma 7 with the `pg` driver adapter
- `prisma.config.ts` — TypeScript-based Prisma configuration
- Generated client output: `generated/prisma/`
- Exports the Prisma client instance for use in the server

### `@repo/env` — Environment Validation

Utilities for validating environment variables with Zod:

- `unsafeValidateEnv()` — parse and validate env against a schema (throws on failure)
- `isDevelopmentEnvironment()`, `isProductionEnvironment()`, `isTestEnvironment()` — environment checkers
- Used by `web`, `server`, and `mobile` to ensure env correctness at startup

### `@repo/shared-validations` — Shared Zod Schemas

Reusable Zod schemas shared across the entire monorepo:

- Common validation patterns (e.g., trimmed non-empty strings)
- Used by `api-contract`, `web`, `mobile`, and anywhere validation is needed

### `@repo/typescript-config` — TypeScript Configuration

Shared base `tsconfig.json` with strict, modern defaults:

---

## Dependency Management

This template uses [**pnpm catalogs**](https://pnpm.io/catalogs) (`pnpm-workspace.yaml`) to pin shared dependency versions in a single place (Some dependencies that are not shared are installed regularly as for now). When adding a dependency used across multiple packages:

```yaml
# pnpm-workspace.yaml
catalog:
  zod: ^4.4.3
```

Then reference it in any `package.json`:

```json
{
  "dependencies": {
    "zod": "catalog:"
  }
}
```

This guarantees version consistency across the entire monorepo.

---

## Shadcn UI

Out of the box support for shadcn with direct component installation.

## Environment Variables

Environment variables are **validated at startup** using Zod schemas via the `@repo/env` package. If a required variable is missing or malformed, the app will crash immediately with a clear error.

| App        | Env File                 | Variables                          |
| ---------- | ------------------------ | ---------------------------------- |
| `server`   | `apps/server/.env`       | `PORT`, `NODE_ENV`, `DATABASE_URL` |
| `web`      | `apps/web/.env`          | `VITE_API_URL`                     |
| `database` | `packages/database/.env` | `DATABASE_URL`                     |

### Adding a new env variable

1. Add the variable to the relevant `.env` file
2. Add it to the Zod schema in the app's `src/env.ts`
3. If it's a Turbo-relevant env, add it to `globalEnv` in `turbo.json`

---

## Database

The database layer uses **Prisma 7** with **PostgreSQL**:

```bash
# Generate the Prisma client (required after schema changes)
turbo run db:generate

# Create and run a new migration
turbo run db:migrate

# Deploy migrations in production
turbo run db:deploy

# Open Prisma Studio (GUI)
turbo run db:studio
```

### Schema location

The Prisma schema lives at `packages/database/prisma/schema.prisma`. Edit your models there and run `db:migrate` to create a migration.

> **Note:** The `dev` and `build` Turbo tasks depend on `db:generate`, so the Prisma client is always up to date before apps start.

---

## Linting & Formatting

This template uses [oxlint](https://oxc.rs/docs/guide/usage/linter) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) — Rust-based, blazing-fast alternatives to ESLint and Prettier.

```bash
# Lint
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues

# Format
pnpm format        # Check formatting
pnpm format:fix    # Auto-fix formatting (also runs lint:fix first)
```

### Configuration

- **`.oxlintrc.json`** — Plugins: `react`, `typescript`, `oxc`, `eslint`, `import`, `node`, `turbo`, `@tanstack/router`. Type-aware mode enabled.
- **`.oxfmtrc.json`** — Single quotes, no semicolons, trailing comma: none, Tailwind class sorting, import sorting, package.json sorting.

---

## Conventions

### Module System

- **All packages use ESM** (`"type": "module"`)
- TypeScript is configured with `NodeNext` module resolution — use `.js` extensions in relative imports within compiled packages
- `verbatimModuleSyntax: true` — use `import type` for type-only imports

### Subpath Imports

Apps and packages use [Node.js subpath imports](https://nodejs.org/api/packages.html#subpath-imports) (`#` prefix) for clean internal paths:

```tsx
// Instead of: import { env } from '../../env'
import { env } from "#src/env";
```

### Compiled Packages

Packages like `api-contract`, `api-client`, `env`, `shared-validations`, and `database` are **compiled** (via `tsc`) and export from `dist/`.

```json
{
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  }
}
```

- `types` points to source `.ts` for IDE intellisense
- `default` points to compiled `.js` for runtime

### API Versioning

Both the server routes and shared packages (`api-contract`, `api-client`) follow a `v1/` versioning structure, making it straightforward to add `v2/` when needed.

---

## License

MIT
