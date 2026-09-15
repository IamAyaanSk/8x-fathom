# F2 — Decisions

## Dev proxy and cookie host

Vite (`:5173`) and Express (`:3000`) are different origins. Session cookies must be set for the SPA host. Locally:

- `BETTER_AUTH_URL` = `WEB_ORIGIN` = `http://localhost:5173`
- `VITE_API_URL` = `http://localhost:5173`
- Vite proxies `/api` to Express
- Google redirect URI is `http://localhost:5173/api/auth/callback/google`

Production can use a single public origin.

## Google only

No email/password, Microsoft, or SSO. First Google sign-in creates the user. Calendar scopes stay on F3 (`linkSocial`).

F2 still requests `accessType: 'offline'` and `prompt: 'select_account consent'` so a refresh token is stored for later Calendar API calls. Google may not re-issue a refresh token until the user revokes app access.

## Login UI

OAuth is a button + redirect, so no React Hook Form. Layout follows Fathom’s dark card + quote rhythm, but only Google and no fake social-proof logos. Auth routes wrap a local `dark` class so login can be dark without forcing the rest of the app.

## Protected API

All `/api/v1` routes use `requireSession`. `GET /users` returns only the signed-in user so the demo endpoint does not list every account.

## Env before Prisma

`@repo/db` reads `DATABASE_URL` when the Prisma client module loads. The server must import `#src/env` (which runs `loadEnvFile()`) **before** any `@repo/db` import. Otherwise OAuth fails with a 500 (`verification` table missing) because Prisma connects without a URL. Entry: `import '#src/env'` first in `server.ts`; `auth.ts` imports `env` before `prisma`.
