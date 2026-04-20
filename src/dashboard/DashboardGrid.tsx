import { useMemo, useState, useEffect } from "react";
import RGL, { Responsive, WidthProvider } from "react-grid-layout";
import { Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetRenderer } from "./WidgetRenderer";
import type { DashboardConfig, WidgetConfig } from "./types";
import type { MetricInputs } from "./metrics";

type LayoutItem = RGL.Layout;

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  dashboard: DashboardConfig;
  inputs: MetricInputs;
  editMode: boolean;
  onLayoutsChange: (items: Array<{ id: string; x: number; y: number; w: number; h: number }>) => void;
  onEditWidget: (widget: WidgetConfig) => void;
  onRemoveWidget: (id: string) => void;
}

export function DashboardGrid({
  dashboard, inputs, editMode, onLayoutsChange, onEditWidget, onRemoveWidget,
}: DashboardGridProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const layouts = useMemo(() => {
    const lg: LayoutItem[] = dashboard.widgets.map(w => ({
      i: w.id, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h, minW: 2, minH: 2,
    }));
    // Mobile: stack each widget full width, in current order
    const sorted = [...dashboard.widgets].sort((a, b) =>
      a.layout.y === b.layout.y ? a.layout.x - b.layout.x : a.layout.y - b.layout.y,
    );
    const xs: LayoutItem[] = sorted.map((w, idx) => ({
      i: w.id, x: 0, y: idx * 4, w: 4, h: Math.max(3, Math.min(w.layout.h, 5)), static: true,
    }));
    return { lg, md: lg, sm: lg, xs, xxs: xs };
  }, [dashboard.widgets]);

  const handleLayoutChange = (current: LayoutItem[]) => {
    if (isMobile || !editMode) return;
    onLayoutsChange(current.map(l => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));
  };

  if (dashboard.widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-foreground">This dashboard is empty</p>
        <p className="text-sm text-muted-foreground mt-1">Click "Add widget" to get started.</p>
      </div>
    );
  }

  return (
    <div className={cn(editMode && "dashboard-edit-mode")}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 4 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={editMode && !isMobile}
        isResizable={editMode && !isMobile}
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        preventCollision={false}
        draggableCancel=".widget-control"
      >
        {dashboard.widgets.map(widget => (
          <div key={widget.id} className="group">
            <div className="relative h-full w-full">
              <WidgetRenderer widget={widget} inputs={inputs} compact={widget.layout.h <= 3} />
              {editMode && !isMobile && (
                <div className="widget-control absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={() => onEditWidget(widget)}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-background/90 backdrop-blur border border-border hover:bg-muted text-foreground shadow-sm"
                    title="Configure"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveWidget(widget.id)}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-background/90 backdrop-blur border border-border hover:bg-destructive hover:text-destructive-foreground text-foreground shadow-sm"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
