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

export async function fetchTelavoxCalls(fromDate: string, toDate: string) {
  const settings = getApiSettings();
  const data = await invokeFunction("telavox-calls", {
    apiKey: settings.telavox_api_key || undefined,
    baseUrl: settings.telavox_base_url || undefined,
    fromDate,
    toDate,
  });
  return data.calls as any[];
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

export async function fetchPipedriveActivities(startDate: string, endDate: string, userId?: number) {
  const settings = getApiSettings();
  const data = await invokeFunction("pipedrive-activities", {
    apiToken: settings.pipedrive_api_token || undefined,
    baseUrl: settings.pipedrive_base_url || undefined,
    startDate,
    endDate,
    userId: userId || undefined,
  });
  return data.meetings as any[];
}

export async function fetchPipedriveUsers() {
  const settings = getApiSettings();
  const data = await invokeFunction("pipedrive-users", {
    apiToken: settings.pipedrive_api_token || undefined,
    baseUrl: settings.pipedrive_base_url || undefined,
  });
  return data.users as Array<{ id: number; name: string; email: string; active: boolean }>;
}
