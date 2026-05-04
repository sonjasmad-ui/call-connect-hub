## Short answer

You don't need a Telavox webhook. The dashboard pulls call history on demand, so it needs a **REST API token** (Bearer token), not a webhook. Webhooks push events to us — useful for real-time, but the current architecture polls `GET /calls`, which requires an API token.

The Telavox REST API exists but it's **not self-serve** in the normal admin UI. That's why you only see "Webhooks" — the API token is provisioned by Telavox.

## How to get a Telavox API token

You have three realistic paths. Pick one:

### Option A — Request an API token from Telavox (recommended)
1. Email `support@telavox.com` (or your account manager) and ask for **REST API access** for your account.
2. Tell them you need the scopes: **read calls, read recordings, read extensions/users**.
3. They will issue a **Bearer token** tied to your tenant. Base URL is `https://api.telavox.se`.
4. Paste the token into the dashboard's Settings dialog (Telavox API key field). Done.

This is what the current code expects (`Authorization: Bearer <token>` against `https://api.telavox.se/calls`, `/extensions/`).

### Option B — Per-user Basic Auth (works today without contacting support)
Telavox also accepts a personal login (`Authorization: Basic base64(email:password)`) on the same endpoints. Each user only sees their own calls — fine for a single-AE setup, not great for a team dashboard.

If you want this, I can add a small toggle in Settings: "Auth type → Bearer token / Basic (email + password)" and adjust the edge function accordingly.

### Option C — Switch to webhooks (different architecture)
If Telavox refuses to issue an API token, we go event-driven instead of polling:
- Create a `telavox-webhook` edge function that receives call events.
- Store calls in a `calls` table in Lovable Cloud.
- Dashboard reads from the table instead of calling Telavox live.

This is more work (new table + RLS + webhook handler + backfill story) and you lose historical data before the webhook was set up. Only worth it if Option A is blocked.

## My recommendation

Go with **Option A**. Email Telavox support today; meanwhile keep using dummy data. If they're slow, I'll add Option B (Basic auth toggle) as a fallback so you can demo with your own account.

## What I'll do once you decide

- **If A**: nothing to change in code — paste the token in Settings and it works.
- **If B**: add an "Auth type" selector in `SettingsDialog.tsx`, update `telavox-calls` and `telavox-users` edge functions to support `Basic` auth, redeploy.
- **If C**: create `telavox-webhook` function + `calls` table + migration + swap `useDashboardData` to read from the DB.

Tell me which option (A, B, or C) and I'll proceed.
