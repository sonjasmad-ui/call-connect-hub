import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import {
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Target, Clock, Timer, Zap, Repeat, Activity, CalendarDays, Hourglass,
  CalendarCheck, TrendingUp, Trophy, Flag,
  LineChart as LineIcon, PieChart as PieIcon, BarChart3,
  Users, Layers, Mic, Calendar, GitBranch,
  Pencil, Check, Search, Building2, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallRecord, Meeting } from "@/data/dummyData";
import type { WidgetConfig } from "./types";
import { getWidgetDefinition, ACCENT_HSL } from "./registry";
import {
  computeScalar, computeTrend, computeBreakdown, computeTableRows,
  type MetricInputs,
} from "./metrics";
import { formatValue } from "./format";
import { CallDetailDialog } from "@/components/dashboard/CallDetailDialog";

const ICONS: Record<string, LucideIcon> = {
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Target, Clock, Timer, Zap, Repeat, Activity, CalendarDays, Hourglass,
  CalendarCheck, TrendingUp, Trophy, Flag,
  LineChart: LineIcon, PieChart: PieIcon, BarChart3,
  Users, Layers, Mic, Calendar, GitBranch,
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  background: "hsl(var(--card))",
  padding: "8px 12px",
  fontSize: 12,
};

const gridStyle = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };

const PIE_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const ENCOURAGEMENT = [
  { min: 0,   text: "Let's get rolling — every call counts." },
  { min: 25,  text: "Solid start. Keep the momentum." },
  { min: 50,  text: "Halfway there. You've got this." },
  { min: 75,  text: "Nearly there — push through!" },
  { min: 100, text: "Target smashed. Outstanding work." },
];

function getEncouragement(pct: number) {
  return [...ENCOURAGEMENT].reverse().find(e => pct >= e.min)!.text;
}

interface WidgetRendererProps {
  widget: WidgetConfig;
  inputs: MetricInputs;
  compact?: boolean;
  onUpdateWidget?: (w: WidgetConfig) => void;
  onOpenBookings?: () => void;
}

export function WidgetRenderer({ widget, inputs, compact, onUpdateWidget, onOpenBookings }: WidgetRendererProps) {
  const def = getWidgetDefinition(widget.metric);
  const accent = def.accent ?? "blue";
  const accentVar = ACCENT_HSL[accent];
  const Icon = def.icon ? ICONS[def.icon] : null;
  const isKpi = widget.visualization === "kpi";
  const isProgress = widget.visualization === "progress";

  const showHeaderIcon = (isKpi || isProgress) && Icon;

  // Bookings KPI is click-through to a list of booked companies
  const isBookingsClickable =
    !!onOpenBookings &&
    (widget.metric === "bookings" || widget.metric === "bookingTarget");

  return (
    <Card
      className={cn(
        "h-full w-full overflow-hidden flex flex-col transition-shadow relative",
        widget.featured
          ? "border-0 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.45)] text-primary-foreground"
          : "glass-card",
      )}
      style={
        widget.featured
          ? {
              background: `linear-gradient(135deg, hsl(${accentVar}) 0%, hsl(${accentVar} / 0.78) 60%, hsl(var(--gradient-end) / 0.85) 100%)`,
            }
          : undefined
      }
    >
      {/* subtle decorative orb for featured */}
      {widget.featured && (
        <div
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-25 blur-2xl"
          style={{ background: "hsl(var(--primary-foreground))" }}
        />
      )}

      {/* Header */}
      <div className="px-3 sm:px-4 pt-3 pb-1.5 flex items-start justify-between gap-2 shrink-0 relative">
        <div className="flex items-start gap-2.5 min-w-0">
          {showHeaderIcon && (
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              )}
              style={
                widget.featured
                  ? { background: "hsl(var(--primary-foreground) / 0.18)", color: "hsl(var(--primary-foreground))" }
                  : { background: `hsl(${accentVar} / 0.12)`, color: `hsl(${accentVar})` }
              }
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 pt-0.5">
            <p className={cn(
              "text-[11px] font-semibold tracking-wide uppercase truncate",
              widget.featured ? "text-primary-foreground/90" : "text-muted-foreground",
            )}>
              {widget.title}
            </p>
            {/* Data interval under title */}
            <p className={cn(
              "text-[10px] truncate mt-0.5",
              widget.featured ? "text-primary-foreground/70" : "text-muted-foreground/70",
            )}>
              {inputs.dateRange === "last7" ? "Last 7 days" :
               inputs.dateRange === "last30" ? "Last 30 days" :
               inputs.dateRange === "last90" ? "Last 90 days" :
               inputs.dateRange === "thisMonth" ? "This month" :
               inputs.dateRange === "lastMonth" ? "Last month" :
               inputs.dateRange === "thisWeek" ? "This week" :
               inputs.dateRange === "today" ? "Today" : inputs.dateRange}
            </p>
            {/* Only show subtitle in header for non-KPI widgets */}
            {widget.subtitle && !isKpi && (
              <p className={cn(
                "text-[11px] truncate",
                widget.featured ? "text-primary-foreground/80" : "text-muted-foreground",
              )}>{widget.subtitle}</p>
            )}
          </div>
        </div>
        {widget.featured && (
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground/90 shrink-0 mt-1" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 px-3 sm:px-4 pb-3 sm:pb-4 relative">
        <Body
          widget={widget}
          inputs={inputs}
          compact={compact}
          accentVar={accentVar}
          onUpdateWidget={onUpdateWidget}
          onOpenBookings={isBookingsClickable ? onOpenBookings : undefined}
        />
      </div>
    </Card>
  );
}

function Body({
  widget, inputs, compact, accentVar, onUpdateWidget,
}: WidgetRendererProps & { accentVar: string }) {
  const { visualization, metric, format } = widget;
  const def = getWidgetDefinition(metric);
  const category = def.category;

  if (visualization === "kpi") {
    const value = computeScalar(metric, inputs);
    const subtitle = widget.subtitle || def.description;
    return (
      <div className="h-full flex flex-col justify-center">
        <p className={cn(
          "font-bold leading-none text-foreground",
          compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
          widget.featured && "gradient-text",
        )}>
          {formatValue(value, format)}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
    );
  }

  if (visualization === "progress") {
    return (
      <ProgressBody
        widget={widget}
        inputs={inputs}
        accentVar={accentVar}
        onUpdateWidget={onUpdateWidget}
      />
    );
  }

  // Trend metrics or KPI metric rendered as line/bar
  if (category === "trend" || ((visualization === "line" || visualization === "bar") && (category === "kpi" || category === "booking"))) {
    const trendMetric =
      category === "trend" ? metric :
      metric === "totalCalls" || metric === "answeredCalls" ? "dailyCallsTrend" :
      metric === "talkTime" || metric === "avgTalkTime" ? "dailyTalkTimeTrend" :
      metric === "bookings" ? "bookingsTrend" :
      metric === "answerRate" ? "successRateTrend" :
      "dailyCallsTrend";
    const data = computeTrend(trendMetric, inputs);

    if (visualization === "bar") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatValue(v, format), widget.title]} />
            <Bar dataKey="value" fill={`hsl(${accentVar})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id={`g-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`hsl(${accentVar})`} stopOpacity={0.35} />
              <stop offset="95%" stopColor={`hsl(${accentVar})`} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatValue(v, format), widget.title]} />
          <Area type="monotone" dataKey="value" stroke={`hsl(${accentVar})`} strokeWidth={2.5} fill={`url(#g-${widget.id})`} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (visualization === "donut") {
    const data = computeBreakdown(metric, inputs);
    if (data.length === 0) return <EmptyState text="No data for this period." />;
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`${v} (${Math.round((v / total) * 100)}%)`, name]}
              />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-foreground leading-none">{total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-semibold text-foreground">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
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
          <Bar dataKey="value" fill={`hsl(${accentVar})`} radius={[4, 4, 0, 0]} />
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

// ============= Progress widget with editable target & motivation =============

function ProgressBody({
  widget, inputs, accentVar, onUpdateWidget,
}: {
  widget: WidgetConfig;
  inputs: MetricInputs;
  accentVar: string;
  onUpdateWidget?: (w: WidgetConfig) => void;
}) {
  const value = computeScalar(widget.metric, inputs);
  const defaultTarget =
    widget.metric === "bookingTarget" ? inputs.bookingTarget :
    widget.metric === "callTarget" ? inputs.callTarget :
    100;
  const target = (widget.options?.target as number | undefined) ?? defaultTarget;
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const remaining = Math.max(0, target - Math.round(value));

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(target.toString());

  const save = () => {
    const next = parseInt(draft, 10);
    if (!Number.isNaN(next) && next > 0 && onUpdateWidget) {
      onUpdateWidget({
        ...widget,
        options: { ...(widget.options ?? {}), target: next },
      });
    }
    setEditing(false);
  };

  return (
    <div className="h-full flex flex-col justify-center gap-2.5">
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
            {formatValue(value, widget.format)}
          </span>
          <span className="text-sm text-muted-foreground">/ </span>
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && save()}
                autoFocus
                className="widget-control h-7 w-16 text-sm px-2"
                inputMode="numeric"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={save}
                className="widget-control h-7 w-7"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setDraft(target.toString()); setEditing(true); }}
              className="widget-control inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
              title="Edit target"
            >
              {formatValue(target, widget.format)}
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        <span
          className="text-sm font-bold tabular-nums shrink-0"
          style={{ color: `hsl(${accentVar})` }}
        >
          {pct}%
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, hsl(${accentVar}) 0%, hsl(${accentVar} / 0.7) 100%)`,
          }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground italic">
        {remaining > 0
          ? `${remaining} to go — ${getEncouragement(pct)}`
          : `🎉 ${getEncouragement(pct)}`}
      </p>
    </div>
  );
}

// ============= Helpers =============

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

// ============= Call table — mobile-first, with name/company columns, search & detail dialog =============

function CallTable({ rows, compact }: { rows: CallRecord[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CallRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.contactName?.toLowerCase().includes(q) ||
      r.company?.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const limit = compact ? 6 : 25;
  const data = filtered.slice(0, limit);

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      {/* Search bar */}
      <div className="relative shrink-0 widget-control">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name, company, phone…"
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-auto -mx-1">
        {/* Mobile: card list */}
        <div className="md:hidden space-y-1.5 px-1">
          {data.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="w-full text-left p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 active:bg-muted transition-colors flex items-center gap-2.5"
            >
              <CallIcon call={c} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.contactName || c.phone}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.company || c.phone} · {c.date.slice(5)} {c.time}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={statusVariant(c.status)} className="text-[10px] capitalize">
                  {c.status}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDur(c.duration)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop / tablet: table */}
        <table className="hidden md:table w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="text-muted-foreground">
              <th className="text-left px-2 py-2 font-medium w-10"></th>
              <th className="text-left px-2 py-2 font-medium">Contact</th>
              <th className="text-left px-2 py-2 font-medium">Company</th>
              <th className="text-left px-2 py-2 font-medium">Phone</th>
              <th className="text-left px-2 py-2 font-medium">When</th>
              <th className="text-left px-2 py-2 font-medium">Status</th>
              <th className="text-right px-2 py-2 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className="border-t border-border/40 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <td className="px-2 py-2"><CallIcon call={c} /></td>
                <td className="px-2 py-2 font-medium text-foreground truncate max-w-[160px]">
                  {c.contactName || <span className="text-muted-foreground italic">Unknown</span>}
                </td>
                <td className="px-2 py-2 text-muted-foreground truncate max-w-[160px]">
                  {c.company || "—"}
                </td>
                <td className="px-2 py-2 font-mono text-[11px] text-muted-foreground">{c.phone}</td>
                <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                  {c.date.slice(5)} {c.time}
                </td>
                <td className="px-2 py-2">
                  <Badge variant={statusVariant(c.status)} className="text-[10px] capitalize">
                    {c.status}
                  </Badge>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{fmtDur(c.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">
              {query ? "No calls match your search." : "No calls in this period."}
            </p>
          </div>
        )}
      </div>

      <CallDetailDialog call={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CallIcon({ call }: { call: CallRecord }) {
  if (call.status === "missed") {
    return (
      <div className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
        <PhoneMissed className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (call.direction === "inbound") {
    return (
      <div className="h-7 w-7 rounded-full bg-[hsl(var(--stat-green))]/10 text-[hsl(var(--stat-green))] flex items-center justify-center shrink-0">
        <PhoneIncoming className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-[hsl(var(--stat-blue))]/10 text-[hsl(var(--stat-blue))] flex items-center justify-center shrink-0">
      <PhoneOutgoing className="h-3.5 w-3.5" />
    </div>
  );
}

const statusVariant = (s: CallRecord["status"]) =>
  s === "answered" ? "default" : s === "missed" ? "destructive" : "secondary";

const fmtDur = (s: number) => {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

function MeetingTable({ rows, compact }: { rows: Meeting[]; compact?: boolean }) {
  const limit = compact ? 5 : 12;
  const data = rows.slice(0, limit);
  return (
    <div className="h-full overflow-auto space-y-1.5">
      {data.map(m => (
        <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="min-w-0 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[hsl(var(--stat-rose))]/10 text-[hsl(var(--stat-rose))] flex items-center justify-center shrink-0">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                {m.contactName} <Building2 className="h-2.5 w-2.5" /> {m.company}
              </p>
            </div>
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
