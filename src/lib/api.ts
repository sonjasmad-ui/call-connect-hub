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

export function hasTelavoxConfig(): boolean {
  return !!getApiSettings().telavox_api_key;
}

export function hasPipedriveConfig(): boolean {
  return !!getApiSettings().pipedrive_api_token;
}

async function invokeFunction(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `Edge function ${name} failed`);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Telavox ──

export async function fetchTelavoxCalls(fromDate: string, toDate: string) {
  const settings = getApiSettings();
  if (!settings.telavox_api_key) throw new Error("Telavox API key not configured");

  const data = await invokeFunction("telavox-calls", {
    apiKey: settings.telavox_api_key,
    baseUrl: settings.telavox_base_url || undefined,
    fromDate,
    toDate,
  });
  return data.calls as any[];
}

export async function fetchTelavoxUsers() {
  const settings = getApiSettings();
  if (!settings.telavox_api_key) throw new Error("Telavox API key not configured");

  const data = await invokeFunction("telavox-users", {
    apiKey: settings.telavox_api_key,
    baseUrl: settings.telavox_base_url || undefined,
  });
  return data.users as Array<{ id: string; name: string; email: string; extension: string }>;
}

// ── Pipedrive ──

export async function fetchPipedriveActivities(startDate: string, endDate: string, userId?: number) {
  const settings = getApiSettings();
  if (!settings.pipedrive_api_token) throw new Error("Pipedrive API token not configured");

  const data = await invokeFunction("pipedrive-activities", {
    apiToken: settings.pipedrive_api_token,
    baseUrl: settings.pipedrive_base_url || undefined,
    startDate,
    endDate,
    userId: userId || undefined,
  });
  return data.meetings as any[];
}

export async function fetchPipedriveUsers() {
  const settings = getApiSettings();
  if (!settings.pipedrive_api_token) throw new Error("Pipedrive API token not configured");

  const data = await invokeFunction("pipedrive-users", {
    apiToken: settings.pipedrive_api_token,
    baseUrl: settings.pipedrive_base_url || undefined,
  });
  return data.users as Array<{ id: number; name: string; email: string; active: boolean }>;
}
