# F3 — Implementation

Calendar connect (`linkSocial`), sync eligible events into `Meeting` / `CalendarWatch`, Better Auth webhook, and minimal home UI.

## Steps

1. `linkSocial` with `calendar.events.readonly` on home; status via `GET /api/v1/calendar/status`.
2. `apps/server/src/services/calendar-sync.ts` — `googleapis` list/upsert **Meeting** (7-day window, `meetingUrl` required, pre-dispatch delete on cancel), `syncToken`, `events.watch` when HTTPS.
3. `apps/server/src/auth/plugins/calendar.ts` — `POST /calendar/webhook` + OAuth `after` hook on `/callback/:id`.
4. `apps/server/src/auth.ts` — register plugin, `disableOriginCheck: ['/calendar/webhook']`.
5. Prisma `CalendarWatch.channelToken` migration; later migration merges `CalendarEvent` into `Meeting`.
6. `packages/api-contract` + `api-client` + `/api/v1/calendar/status` and `/calendar/sync`.
7. Home page connect card (meetings list UI — F4).

## Files

| Path                                          | Change                     |
| --------------------------------------------- | -------------------------- |
| `apps/server/src/auth/plugins/calendar.ts`    | Webhook + callback hook    |
| `apps/server/src/services/calendar-sync.ts`   | Sync + watch               |
| `apps/server/src/services/google-account.ts`  | Token + connection helpers |
| `apps/server/src/v1/controllers/calendar.ts`  | Status, sync               |
| `packages/api-contract/src/v1/calendar.ts`    | Zod contracts              |
| `packages/api-client/src/v1/calendar/*`       | Client + hooks             |
| `apps/web/src/components/pages/home-page.tsx` | Connect CTA                |
| `packages/database/prisma/schema.prisma`      | `Meeting` calendar fields  |

## Acceptance

- Connect Calendar completes; `GET /calendar/status` → `connected: true`
- Eligible events upsert `Meeting` for the next 7 days; `POST /calendar/sync` is idempotent
- Webhook rejects invalid channel/token
- `pnpm lint` / `check-types` on touched packages
