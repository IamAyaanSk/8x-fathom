# Agent context — 8x fathom AI

Use this file for repo-wide architecture, boundaries, and workflows. Product description and domain rules will be added later.

## Monorepo

- **Tooling**: Turborepo + pnpm workspaces (`catalogMode: prefer` — use `catalog:` for shared dependency versions in `pnpm-workspace.yaml`).
- **Node**: `>=22`. **ESM** everywhere (`"type": "module"`, TypeScript `module` / `moduleResolution`: `NodeNext`).
- **Root scripts**: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm format:fix`.
- **Turbo env**: `DATABASE_URL` and `NODE_ENV` are `globalEnv`. New env vars used in tasks must be declared in `turbo.json` (oxlint `turbo/no-undeclared-env-vars`).

## Layout

| Path | Role |
|------|------|
| `apps/web` | Vite 8, React 19, TanStack Router (file routes), TanStack Query |
| `apps/server` | Express 5 API at `/api/v1` |
| `packages/api-contract` | Zod schemas + inferred types for API payloads |
| `packages/api-client` | Axios calls + TanStack Query `queryOptions` / hooks |
| `packages/database` (`@repo/db`) | Prisma 7 + PostgreSQL (`PrismaPg` adapter) |
| `packages/env` | `unsafeValidateEnv` + `NODE_ENV` helpers |
| `packages/shared-validations` | Reusable Zod field schemas |
| `packages/ui-web` | shadcn/ui-style components + `globals.css` |
| `packages/typescript-config` | Shared `base.json` tsconfig |

## Package boundaries

Respect dependency direction:

```
shared-validations → api-contract → api-client → apps/web
@repo/db → apps/server
@repo/env → apps/*
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
