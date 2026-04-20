import { useEffect, useState, useCallback } from "react";
import { dashboardStore, makeId } from "./storage";
import { getWidgetDefinition } from "./registry";
import type { DashboardConfig, MetricKey, WidgetConfig } from "./types";

/**
 * Manages the list of dashboards + active selection, with localStorage persistence.
 * The shape mirrors what a future backend hook would return.
 */
export function useDashboards() {
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Initial load
  useEffect(() => {
    const all = dashboardStore.loadAll();
    setDashboards(all);
    const stored = dashboardStore.getActiveId();
    const exists = stored && all.some(d => d.id === stored);
    setActiveId(exists ? stored! : all[0].id);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (dashboards.length > 0) dashboardStore.saveAll(dashboards);
  }, [dashboards]);

  useEffect(() => {
    if (activeId) dashboardStore.setActiveId(activeId);
  }, [activeId]);

  const active = dashboards.find(d => d.id === activeId) ?? dashboards[0];

  const updateActive = useCallback((mutator: (d: DashboardConfig) => DashboardConfig) => {
    setDashboards(prev => prev.map(d => d.id === activeId ? mutator({ ...d, updatedAt: new Date().toISOString() }) : d));
  }, [activeId]);

  const createDashboard = useCallback((name: string) => {
    const id = makeId("dash");
    const now = new Date().toISOString();
    const next: DashboardConfig = {
      id, name, widgets: [], createdAt: now, updatedAt: now,
    };
    setDashboards(prev => [...prev, next]);
    setActiveId(id);
  }, []);

  const renameDashboard = useCallback((id: string, name: string) => {
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, name, updatedAt: new Date().toISOString() } : d));
  }, []);

  const duplicateDashboard = useCallback((id: string) => {
    setDashboards(prev => {
      const src = prev.find(d => d.id === id);
      if (!src) return prev;
      const newId = makeId("dash");
      const copy: DashboardConfig = {
        ...src,
        id: newId,
        name: `${src.name} (copy)`,
        isPreset: false,
        widgets: src.widgets.map(w => ({ ...w, id: makeId("w") })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveId(newId);
      return [...prev, copy];
    });
  }, []);

  const deleteDashboard = useCallback((id: string) => {
    setDashboards(prev => {
      const filtered = prev.filter(d => d.id !== id);
      if (id === activeId && filtered[0]) setActiveId(filtered[0].id);
      return filtered;
    });
  }, [activeId]);

  const addWidget = useCallback((metric: MetricKey) => {
    const def = getWidgetDefinition(metric);
    updateActive(d => {
      // Place at bottom
      const maxY = d.widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0);
      const widget: WidgetConfig = {
        id: makeId("w"),
        metric,
        visualization: def.supportedVisualizations[0],
        title: def.title,
        format: def.defaultFormat,
        layout: { x: 0, y: maxY, w: def.defaultLayout.w, h: def.defaultLayout.h },
      };
      return { ...d, widgets: [...d.widgets, widget] };
    });
  }, [updateActive]);

  const updateWidget = useCallback((next: WidgetConfig) => {
    updateActive(d => ({ ...d, widgets: d.widgets.map(w => w.id === next.id ? next : w) }));
  }, [updateActive]);

  const removeWidget = useCallback((id: string) => {
    updateActive(d => ({ ...d, widgets: d.widgets.filter(w => w.id !== id) }));
  }, [updateActive]);

  const setFeatured = useCallback((id: string) => {
    updateActive(d => ({ ...d, widgets: d.widgets.map(w => ({ ...w, featured: w.id === id })) }));
  }, [updateActive]);

  const setLayouts = useCallback((items: Array<{ id: string; x: number; y: number; w: number; h: number }>) => {
    updateActive(d => ({
      ...d,
      widgets: d.widgets.map(w => {
        const item = items.find(i => i.id === w.id);
        return item ? { ...w, layout: { x: item.x, y: item.y, w: item.w, h: item.h } } : w;
      }),
    }));
  }, [updateActive]);

  return {
    dashboards,
    active,
    activeId,
    setActiveId,
    createDashboard,
    renameDashboard,
    duplicateDashboard,
    deleteDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    setFeatured,
    setLayouts,
  };
}
