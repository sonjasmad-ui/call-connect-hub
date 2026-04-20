import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { CallRecord, Meeting } from "@/data/dummyData";
import type { WidgetConfig } from "./types";
import { getWidgetDefinition } from "./registry";
import {
  computeScalar, computeTrend, computeBreakdown, computeTableRows,
  type MetricInputs,
} from "./metrics";
import { formatValue } from "./format";

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  background: "hsl(var(--card))",
  padding: "10px 14px",
  fontSize: 12,
};

const gridStyle = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface WidgetRendererProps {
  widget: WidgetConfig;
  inputs: MetricInputs;
  /** Drives compact layouts when the widget is small */
  compact?: boolean;
}

export function WidgetRenderer({ widget, inputs, compact }: WidgetRendererProps) {
  const def = getWidgetDefinition(widget.metric);
  const category = def.category;

  return (
    <Card
      className={cn(
        "h-full w-full overflow-hidden flex flex-col glass-card",
        widget.featured && "ring-1 ring-primary/40 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.35)]",
      )}
    >
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <p className={cn(
            "text-[11px] font-semibold tracking-wider uppercase truncate",
            widget.featured ? "text-primary" : "text-muted-foreground",
          )}>
            {widget.title}
          </p>
          {widget.subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">{widget.subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 px-4 pb-4">
        <Body widget={widget} inputs={inputs} compact={compact} category={category} />
      </div>
    </Card>
  );
}

function Body({ widget, inputs, compact, category }: WidgetRendererProps & { category: string }) {
  const { visualization, metric, format } = widget;

  if (visualization === "kpi") {
    const value = computeScalar(metric, inputs);
    return (
      <div className="h-full flex flex-col justify-center">
        <p className={cn(
          "font-bold leading-none text-foreground",
          compact ? "text-2xl" : "text-3xl",
          widget.featured && "gradient-text",
        )}>
          {formatValue(value, format)}
        </p>
      </div>
    );
  }

  if (visualization === "progress") {
    const value = computeScalar(metric, inputs);
    const target = (widget.options?.target as number | undefined) ??
      (metric === "bookingTarget" ? 30 : metric === "callTarget" ? 3000 : 100);
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    return (
      <div className="h-full flex flex-col justify-center gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {formatValue(value, format)}
            <span className="text-sm font-normal text-muted-foreground"> / {formatValue(target, format)}</span>
          </span>
          <span className={cn("text-sm font-semibold", widget.featured ? "text-primary" : "text-foreground")}>
            {pct}%
          </span>
        </div>
        <Progress value={pct} className="h-2.5" />
      </div>
    );
  }

  if (category === "trend" || (visualization === "line" || visualization === "bar") && category !== "breakdown" && category !== "kpi" && category !== "booking") {
    const data = computeTrend(metric, inputs);
    if (visualization === "bar") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatValue(v, format), widget.title]} />
            <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id={`g-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatValue(v, format), widget.title]} />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill={`url(#g-${widget.id})`} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (category === "kpi" || category === "booking") {
    // KPI metric rendered as a small trendline
    if (visualization === "line" || visualization === "bar") {
      // Synthesize a trend by mapping the calls per day
      const trendMetric =
        metric === "totalCalls" || metric === "answeredCalls" ? "dailyCallsTrend"
        : metric === "talkTime" || metric === "avgTalkTime" ? "dailyTalkTimeTrend"
        : metric === "bookings" ? "bookingsTrend"
        : metric === "answerRate" ? "successRateTrend"
        : "dailyCallsTrend";
      const data = computeTrend(trendMetric, inputs);
      const Chart = visualization === "bar" ? BarChart : LineChart;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatValue(v, format), widget.title]} />
            {visualization === "bar"
              ? <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              : <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />}
          </Chart>
        </ResponsiveContainer>
      );
    }
  }

  if (visualization === "donut") {
    const data = computeBreakdown(metric, inputs);
    if (data.length === 0) return <EmptyState text="No data for this period." />;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (visualization === "bar" && category === "breakdown") {
    const data = computeBreakdown(metric, inputs);
    if (data.length === 0) return <EmptyState text="No data for this period." />;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (visualization === "table") {
    const rows = computeTableRows(metric, inputs);
    if (metric === "recentCalls" || metric === "callRecordings") {
      return <CallTable rows={rows as CallRecord[]} compact={compact} />;
    }
    return <MeetingTable rows={rows as Meeting[]} compact={compact} />;
  }

  return <EmptyState text="No visualization available." />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function CallTable({ rows, compact }: { rows: CallRecord[]; compact?: boolean }) {
  const limit = compact ? 5 : 12;
  const data = rows.slice(0, limit);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  return (
    <div className="h-full overflow-auto -mx-2">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="text-muted-foreground">
            <th className="text-left px-2 py-1.5 font-medium">Date</th>
            <th className="text-left px-2 py-1.5 font-medium">Phone</th>
            <th className="text-left px-2 py-1.5 font-medium">Status</th>
            <th className="text-left px-2 py-1.5 font-medium">Dur</th>
          </tr>
        </thead>
        <tbody>
          {data.map(c => (
            <tr key={c.id} className="border-t border-border/40">
              <td className="px-2 py-1.5 whitespace-nowrap text-foreground">{c.date.slice(5)} {c.time}</td>
              <td className="px-2 py-1.5 font-mono text-[11px]">{c.phone}</td>
              <td className="px-2 py-1.5">
                <Badge variant={c.status === "answered" ? "default" : c.status === "missed" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                  {c.status}
                </Badge>
              </td>
              <td className="px-2 py-1.5">{fmt(c.duration)}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">No calls</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MeetingTable({ rows, compact }: { rows: Meeting[]; compact?: boolean }) {
  const limit = compact ? 5 : 12;
  const data = rows.slice(0, limit);
  return (
    <div className="h-full overflow-auto space-y-1.5">
      {data.map(m => (
        <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{m.contactName} · {m.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge variant="secondary" className="text-[10px]">{m.pipedriveStage}</Badge>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{m.date.slice(5)}</span>
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No meetings</p>
      )}
    </div>
  );
}
