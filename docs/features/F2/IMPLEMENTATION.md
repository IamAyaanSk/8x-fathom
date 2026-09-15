# F2 — Implementation

Google-only Better Auth, session cookies via the Vite `/api` proxy, `/login`, and protected `/api/v1`.

## Steps

1. Add `apps/server/src/auth.ts`: Prisma adapter, Google `accessType: 'offline'` + `prompt: 'select_account consent'`, `trustedOrigins: [WEB_ORIGIN]`.
2. Mount `toNodeHandler(auth)` at `/api/auth/*splat` **before** `json()`. CORS origin = `WEB_ORIGIN`, `credentials: true`.
3. `requireSession` on all `/api/v1` routes; `GET /users` scoped to the session user.
4. Vite proxy `/api` → `https://8d16-2400-1f00-b-2c85-89c7-4cf9-eec5-f666.ngrok-free.app/api/auth/callback/google`. Web `better-auth/react` client + axios `withCredentials`.
5. Auth UI: dark `AuthShell`, Card, Google-only CTA. Pathless `_authenticated` layout guards `/` and `/users`.

## Files

| Path                                                | Change                      |
| --------------------------------------------------- | --------------------------- |
| `apps/server/src/auth.ts`                           | Better Auth instance        |
| `apps/server/src/server.ts`                         | Mount handler, CORS         |
| `apps/server/src/v1/middlewares/require-session.ts` | Session gate                |
| `apps/server/src/v1/routes/index.ts`                | Apply middleware            |
| `apps/server/src/v1/controllers/users.ts`           | Current user only           |
| `apps/web/vite.config.ts`                           | `/api` proxy                |
| `apps/web/src/lib/auth-client.ts`                   | React auth client           |
| `apps/web/src/routes/login.tsx`                     | Sign-in page                |
| `apps/web/src/routes/_authenticated*.tsx`           | Session layout + home/users |
| `packages/ui-web/src/components/card.tsx`           | Card primitive              |

## Acceptance

- Sign in with Google from `/login` lands on `/`
- `GET /api/v1/users` is 401 without a cookie, 200 with a session
- `/users` redirects to `/login` when signed out
- `pnpm lint` / `check-types` for touched packages
