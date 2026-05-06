import { supabase } from "@/integrations/supabase/client";
import type { DashboardConfig } from "./types";
import { SEED_DASHBOARDS } from "./seeds";

const ACTIVE_META_KEY = "active_dashboard";
const DEFAULT_META_KEY = "default_dashboard";
const LEGACY_KEY = "calltrack:dashboards:v2";
const LEGACY_ACTIVE_KEY = "calltrack:active-dashboard:v2";

function readLocalDashboards(): DashboardConfig[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalDashboards(dashboards: DashboardConfig[]) {
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(dashboards));
  } catch {}
}

async function getMetaValue(key: string): Promise<string | null> {
  const { data } = await supabase
    .from("shared_dashboard_meta")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return data?.value ?? null;
}

async function setMetaValue(key: string, value: string): Promise<void> {
  await supabase
    .from("shared_dashboard_meta")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

/**
 * Persistence layer for dashboards — backed by Supabase so layouts sync
 * across all browsers and sessions for everyone using this app.
 */
export const dashboardStore = {
  async loadAll(): Promise<DashboardConfig[]> {
    const { data, error } = await supabase
      .from("shared_dashboards")
      .select("data");

    if (error) {
      console.error("[dashboardStore] load error", error);
      const local = readLocalDashboards();
      return local.length > 0 ? local : SEED_DASHBOARDS();
    }

    if (!data || data.length === 0) {
      // First-time bootstrap: try migrating any local layouts, else seed.
      let initial = readLocalDashboards();
      if (initial.length === 0) initial = SEED_DASHBOARDS();
      await dashboardStore.saveAll(initial);
      return initial;
    }

    const dashboards = data.map(row => row.data as unknown as DashboardConfig);
    writeLocalDashboards(dashboards);
    return dashboards;
  },

  async saveAll(dashboards: DashboardConfig[]): Promise<void> {
    writeLocalDashboards(dashboards);

    // Replace-all strategy: delete missing rows, upsert current ones.
    const ids = dashboards.map(d => d.id);
    if (ids.length > 0) {
      const { error } = await supabase.from("shared_dashboards").delete().not("id", "in", `(${ids.map(i => `"${i}"`).join(",")})`);
      if (error) console.error("[dashboardStore] delete missing error", error);
    } else {
      const { error } = await supabase.from("shared_dashboards").delete().neq("id", "");
      if (error) console.error("[dashboardStore] clear error", error);
    }
    if (dashboards.length > 0) {
      const rows = dashboards.map(d => ({ id: d.id, data: d as never, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("shared_dashboards").upsert(rows, { onConflict: "id" });
      if (error) console.error("[dashboardStore] save error", error);
    }
  },

  async getActiveId(): Promise<string | null> {
    const value = await getMetaValue(ACTIVE_META_KEY);
    if (value) return value;
    // Legacy fallback
    return localStorage.getItem(LEGACY_ACTIVE_KEY);
  },

  async setActiveId(id: string): Promise<void> {
    try {
      localStorage.setItem(LEGACY_ACTIVE_KEY, id);
    } catch {}
    await setMetaValue(ACTIVE_META_KEY, id);
  },

  async getDefaultId(): Promise<string | null> {
    return getMetaValue(DEFAULT_META_KEY);
  },

  async setDefaultId(id: string): Promise<void> {
    await setMetaValue(DEFAULT_META_KEY, id);
  },
};

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
