# F3 — Decisions

## Calendar scopes (incremental OAuth)

F2 sign-in keeps minimal Google scopes. Calendar uses Better Auth [`linkSocial`](https://better-auth.com/docs/concepts/oauth#requesting-additional-scopes) with:

`https://www.googleapis.com/auth/calendar.events.readonly`

We do **not** request full `calendar` or `calendar.events` write scopes. Readonly is enough for list + `events.watch` push notifications.

Enable the **Google Calendar API** on the same OAuth client used for F2.

## Sync window

Eligible Google events from **now through +7 days** (`timeMin` / `timeMax` on full sync) upsert **`Meeting`** rows directly (no separate calendar-event table). Incremental `syncToken` updates still filter writes to that window. Events without a conferencing `meetingUrl` are skipped; cancelled events (or loss of URL) delete **pre-dispatch** meetings (`baasBotId` null). Metadata updates never touch bot, R2, or processing fields.

## Primary calendar only

Sync and watch target `primary`. Multi-calendar selection is out of scope.

## Webhook endpoint

Google `events.watch` `address` = `{BETTER_AUTH_URL}/api/auth/calendar/webhook`, implemented as a Better Auth plugin endpoint (`createAuthEndpoint`), not `/api/v1`.

Security: lookup `CalendarWatch` by `X-Goog-Channel-Id`, verify `X-Goog-Resource-Id` and `X-Goog-Channel-Token` against stored values. Return 404/401 on mismatch.

`advanced.disableOriginCheck` includes `/calendar/webhook` so Google server-to-server POSTs are not blocked by origin/CSRF middleware.

## Local dev without public HTTPS

When `BETTER_AUTH_URL` is not `https://`, skip `events.watch` registration. Use OAuth callback sync + `POST /api/v1/calendar/sync` as fallbacks (F4 will add sync on list load).

## OAuth callback hook

After `/callback/:id`, if the Google account scope includes calendar readonly, run `setupCalendarWatchAndSync` once for that session. Avoids re-running on every token refresh via `databaseHooks.account.update`.
