import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import type { MetricKey, WidgetCategory, WidgetDefinition } from "./types";
import { getAllWidgetDefinitions } from "./registry";

const CATEGORIES: { key: WidgetCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "kpi", label: "KPI" },
  { key: "trend", label: "Trend" },
  { key: "breakdown", label: "Breakdown" },
  { key: "booking", label: "Booking" },
  { key: "table", label: "Table" },
];

interface WidgetLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (metric: MetricKey) => void;
}

export function WidgetLibrary({ open, onOpenChange, onAdd }: WidgetLibraryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<WidgetCategory | "all">("all");

  const widgets = useMemo(() => {
    const all = getAllWidgetDefinitions();
    return all.filter(w => {
      if (category !== "all" && w.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!w.title.toLowerCase().includes(q) && !w.description.toLowerCase().includes(q)
          && !(w.tags || []).some(t => t.includes(q))) return false;
      }
      return true;
    });
  }, [search, category]);

  const handleAdd = (metric: MetricKey) => {
    onAdd(metric);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Widget library</DialogTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {CATEGORIES.map(c => (
                <Button
                  key={c.key}
                  variant={category === c.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(c.key)}
                  className="text-xs shrink-0"
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {widgets.map(w => (
            <WidgetPreviewCard key={w.metric} def={w} onAdd={() => handleAdd(w.metric)} />
          ))}
          {widgets.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-12">
              No widgets match your search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WidgetPreviewCard({ def, onAdd }: { def: WidgetDefinition; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "group text-left rounded-lg border border-border bg-card p-3 hover:border-primary/50 hover:shadow-md transition-all",
      )}
    >
      <div className="h-24 w-full rounded-md bg-muted/40 mb-3 overflow-hidden flex items-center justify-center px-2">
        <MiniPreview def={def} />
      </div>
      <p className="text-sm font-semibold text-foreground truncate">{def.title}</p>
      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{def.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {def.supportedVisualizations.map(v => (
          <span key={v} className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {v}
          </span>
        ))}
      </div>
    </button>
  );
}

const SAMPLE_TREND = [
  { x: "1", y: 8 }, { x: "2", y: 14 }, { x: "3", y: 11 }, { x: "4", y: 18 },
  { x: "5", y: 16 }, { x: "6", y: 22 }, { x: "7", y: 19 },
];
const SAMPLE_BARS = [
  { x: "M", y: 12 }, { x: "T", y: 18 }, { x: "W", y: 14 }, { x: "T", y: 22 }, { x: "F", y: 16 },
];
const SAMPLE_PIE = [
  { name: "A", value: 60 }, { name: "B", value: 25 }, { name: "C", value: 15 },
];
const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

function MiniPreview({ def }: { def: WidgetDefinition }) {
  const viz = def.supportedVisualizations[0];

  if (viz === "kpi") {
    return (
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{def.title}</p>
        <p className="text-2xl font-bold gradient-text">1,247</p>
      </div>
    );
  }
  if (viz === "progress") {
    return (
      <div className="w-full px-2">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
          <span>18 / 30</span><span>60%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }
  if (viz === "donut") {
    return (
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={SAMPLE_PIE} dataKey="value" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
              {SAMPLE_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (viz === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={SAMPLE_BARS} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <Bar dataKey="y" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (viz === "table") {
    return (
      <div className="w-full px-2 space-y-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center justify-between text-[9px]">
            <div className="h-1.5 bg-muted-foreground/30 rounded" style={{ width: `${50 + i * 10}%` }} />
            <div className="h-1.5 w-6 bg-primary/40 rounded" />
          </div>
        ))}
      </div>
    );
  }
  // line / default
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={SAMPLE_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`prev-${def.metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="y" stroke="hsl(var(--chart-1))" strokeWidth={2} fill={`url(#prev-${def.metric})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
