import { supabase } from "@/integrations/supabase/client";
import type { DashboardConfig } from "./types";
import { SEED_DASHBOARDS } from "./seeds";

const ACTIVE_META_KEY = "active_dashboard";
const LEGACY_KEY = "calltrack:dashboards:v2";
const LEGACY_ACTIVE_KEY = "calltrack:active-dashboard:v2";

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
      return SEED_DASHBOARDS();
    }

    if (!data || data.length === 0) {
      // First-time bootstrap: try migrating any local layouts, else seed.
      let initial: DashboardConfig[] = [];
      try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) initial = parsed;
        }
      } catch {}
      if (initial.length === 0) initial = SEED_DASHBOARDS();
      await dashboardStore.saveAll(initial);
      return initial;
    }

    return data.map(row => row.data as unknown as DashboardConfig);
  },

  async saveAll(dashboards: DashboardConfig[]): Promise<void> {
    // Replace-all strategy: delete missing rows, upsert current ones.
    const ids = dashboards.map(d => d.id);
    if (ids.length > 0) {
      await supabase.from("shared_dashboards").delete().not("id", "in", `(${ids.map(i => `"${i}"`).join(",")})`);
    } else {
      await supabase.from("shared_dashboards").delete().neq("id", "");
    }
    if (dashboards.length > 0) {
      const rows = dashboards.map(d => ({ id: d.id, data: d as never, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("shared_dashboards").upsert(rows, { onConflict: "id" });
      if (error) console.error("[dashboardStore] save error", error);
    }
  },

  async getActiveId(): Promise<string | null> {
    const { data } = await supabase
      .from("shared_dashboard_meta")
      .select("value")
      .eq("key", ACTIVE_META_KEY)
      .maybeSingle();
    if (data?.value) return data.value;
    // Legacy fallback
    return localStorage.getItem(LEGACY_ACTIVE_KEY);
  },

  async setActiveId(id: string): Promise<void> {
    await supabase
      .from("shared_dashboard_meta")
      .upsert({ key: ACTIVE_META_KEY, value: id, updated_at: new Date().toISOString() }, { onConflict: "key" });
  },
};

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
