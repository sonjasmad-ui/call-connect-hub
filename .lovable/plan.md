# Fix Pipedrive "non-2xx status code" Error

## Root cause analysis

The `pipedrive-activities` edge function forwards Pipedrive's HTTP status (e.g. 400/401/404) directly back to the client. The client's `invokeFunction` wrapper just shows "Edge Function returned a non-2xx status code" without the underlying `detail`, so we can't tell which of these is happening:

1. **Bad base URL** — Settings still has the placeholder `https://your-company.pipedrive.com/api/v1` (DNS failure or 404).
2. **Wrong activity type key** — `type=meeting` works for most accounts, but custom Pipedrive setups use different keys (`call`, `task`, custom). Invalid type → 400.
3. **Token scope / expired** — 401/403.
4. **API v1 quirks** — `start_date`/`end_date` filters require both to be set, and some accounts now require v2.

## What I'll change

### 1. Surface the real error to the UI
In `src/lib/api.ts` `invokeFunction`, when the function returns an error payload (which it does — with `error` + `detail` fields), throw a message that includes both. Right now `error.message` from `supabase.functions.invoke` is just the generic non-2xx string; the actual JSON body is in `data`.

Fix: read `data.error` and `data.detail` from the response and throw a combined message so the toast actually tells the user what Pipedrive said.

### 2. Make `pipedrive-activities` more robust
- Default base URL: use `https://api.pipedrive.com/api/v1` (works with API token for all accounts) instead of relying on company subdomain.
- Drop the `type=meeting` filter when no meetings come back, OR make it configurable. Safer: don't filter by `type` server-side — fetch all activities and let client filter. This also lets us show calls/tasks if user wants.
- Always log the outgoing URL (with token redacted) and Pipedrive's response body to edge function logs so future debugging is easy.
- If `start_date` or `end_date` is missing, omit both (Pipedrive returns 400 if only one is set).

### 3. Same hardening for `pipedrive-users`
Log outgoing call + response on error.

### 4. Settings dialog: validate base URL
- If the Pipedrive base URL field is empty, that's fine — function defaults to `https://api.pipedrive.com/api/v1`.
- If it still contains `your-company`, show a warning on save and clear it (use default).
- Update placeholder text to clarify: "Leave empty to use https://api.pipedrive.com/api/v1".

## Files to edit
- `supabase/functions/pipedrive-activities/index.ts` — better defaults, logging, no required type filter
- `supabase/functions/pipedrive-users/index.ts` — better logging
- `src/lib/api.ts` — surface `data.error`/`data.detail` from edge function responses
- `src/components/dashboard/SettingsDialog.tsx` — placeholder hint + validation

## After the fix
You'll see the real Pipedrive error in the toast (e.g. "Pipedrive API error [401]: invalid api token" or "[400]: invalid activity type"). Tell me what it says and we can fix it in one more pass — most likely it's just the base URL placeholder still being saved.
