import type { DashboardConfig } from "./types";
import { SEED_DASHBOARDS } from "./seeds";

const STORAGE_KEY = "calltrack:dashboards:v2";
const ACTIVE_KEY = "calltrack:active-dashboard:v2";

/**
 * Persistence layer for dashboards. Currently localStorage-backed but the
 * shape (load/save/setActive) is designed to be swapped for a backend later.
 */
export const dashboardStore = {
  loadAll(): DashboardConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = SEED_DASHBOARDS();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw) as DashboardConfig[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const seeded = SEED_DASHBOARDS();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return parsed;
    } catch {
      return SEED_DASHBOARDS();
    }
  },

  saveAll(dashboards: DashboardConfig[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  },

  getActiveId(): string | null {
    return localStorage.getItem(ACTIVE_KEY);
  },

  setActiveId(id: string): void {
    localStorage.setItem(ACTIVE_KEY, id);
  },
};

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
