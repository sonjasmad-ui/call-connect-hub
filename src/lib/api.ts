import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "calltrack_api_settings";

interface ApiSettings {
  telavox_api_key: string;
  telavox_base_url: string;
  pipedrive_api_token: string;
  pipedrive_base_url: string;
}

export function getApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { telavox_api_key: "", telavox_base_url: "https://api.telavox.se", pipedrive_api_token: "", pipedrive_base_url: "" };
}

// Backend secrets (TELAVOX_API_KEY / PIPEDRIVE_API_TOKEN) are configured in Lovable Cloud,
// so we always attempt live calls. The local key is optional and used only as an override.
export function hasTelavoxConfig(): boolean {
  return true;
}

export function hasPipedriveConfig(): boolean {
  return true;
}

async function invokeFunction(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  // Surface the function's JSON error body even when the HTTP status is non-2xx.
  if (data?.error) {
    const detail = data.detail ? ` — ${typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)}` : "";
    throw new Error(`${data.error}${detail}`);
  }
  if (error) {
    // FunctionsHttpError on supabase-js exposes the response on `context`.
    const ctx: any = (error as any).context;
    if (ctx?.json) {
      try {
        const body = await ctx.json();
        if (body?.error) {
          const detail = body.detail ? ` — ${typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)}` : "";
          throw new Error(`${body.error}${detail}`);
        }
      } catch (e: any) {
        if (e?.message) throw e;
      }
    }
    throw new Error(error.message || `Edge function ${name} failed`);
  }
  return data;
}

// ── Telavox ──

const tz = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
  catch { return "UTC"; }
})();

export async function fetchTelavoxCalls(fromDate: string, toDate: string) {
  const settings = getApiSettings();
  const data = await invokeFunction("telavox-calls", {
    apiKey: settings.telavox_api_key || undefined,
    baseUrl: settings.telavox_base_url || undefined,
    fromDate,
    toDate,
    tz,
  });
  return {
    calls: data.calls as any[],
    meta: data.meta as { mayBeIncomplete?: boolean; limitation?: string } | undefined,
  };
}

export async function fetchTelavoxUsers() {
  const settings = getApiSettings();
  const data = await invokeFunction("telavox-users", {
    apiKey: settings.telavox_api_key || undefined,
    baseUrl: settings.telavox_base_url || undefined,
  });
  return data.users as Array<{ id: string; name: string; email: string; extension: string }>;
}

// ── Pipedrive ──

// In-memory + localStorage cache. Pipedrive's daily token budget is shared company-wide,
// so on 429 we fall back to the last successful response rather than wiping the UI.
const pdCache = new Map<string, { ts: number; data: any }>();
const PD_TTL_MS = 10 * 60_000;
const PD_LS_PREFIX = "pd_cache_v1:";

function pdActivitiesKey(startDate: string, endDate: string, userId?: number, type?: string) {
  return JSON.stringify({ startDate, endDate, userId: userId || 0, type: type || "meeting" });
}

function pdCacheGet(key: string): { ts: number; data: any } | null {
  const mem = pdCache.get(key);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(PD_LS_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      pdCache.set(key, parsed);
      return parsed;
    }
  } catch {}
  return null;
}
function pdCacheSet(key: string, data: any) {
  const entry = { ts: Date.now(), data };
  pdCache.set(key, entry);
  try { localStorage.setItem(PD_LS_PREFIX + key, JSON.stringify(entry)); } catch {}
}

export async function fetchPipedriveActivities(startDate: string, endDate: string, userId?: number, type?: string, force = false) {
  const settings = getApiSettings();
  const key = pdActivitiesKey(startDate, endDate, userId, type);
  const hit = pdCacheGet(key);
  if (!force && hit && Date.now() - hit.ts < PD_TTL_MS) return hit.data as any[];
  try {
    const data = await invokeFunction("pipedrive-activities", {
      apiToken: settings.pipedrive_api_token || undefined,
      baseUrl: settings.pipedrive_base_url || undefined,
      startDate,
      endDate,
      userId: userId || undefined,
      type,
      tz,
    });
    const meetings = data.meetings as any[];
    pdCacheSet(key, meetings);
    return meetings;
  } catch (err) {
    // Network/429/etc — serve stale cache (any age) if available so the dashboard keeps showing real data.
    if (hit) {
      console.warn("Pipedrive call failed, using stale cache:", err);
      return hit.data as any[];
    }
    throw err;
  }
}

export function getCachedPipedriveActivities(startDate: string, endDate: string, userId?: number, type?: string) {
  return (pdCacheGet(pdActivitiesKey(startDate, endDate, userId, type))?.data as any[] | undefined) || null;
}

export async function fetchPipedriveUsers() {
  const settings = getApiSettings();
  const data = await invokeFunction("pipedrive-users", {
    apiToken: settings.pipedrive_api_token || undefined,
    baseUrl: settings.pipedrive_base_url || undefined,
  });
  return data.users as Array<{ id: number; name: string; email: string; active: boolean }>;
}
