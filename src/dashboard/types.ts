// Dashboard & widget type system

export type VisualizationType =
  | "kpi"
  | "line"
  | "bar"
  | "donut"
  | "table"
  | "progress";

export type DisplayFormat = "integer" | "decimal" | "percent" | "duration" | "currency";

export type WidgetCategory =
  | "kpi"
  | "trend"
  | "breakdown"
  | "activity"
  | "booking"
  | "call"
  | "table";

/** A metric is the raw "what data" identifier; visualization is "how to render". */
export type MetricKey =
  // KPI metrics
  | "totalCalls"
  | "answeredCalls"
  | "answerRate"
  | "talkTime"
  | "avgTalkTime"
  | "callsPerActiveHour"
  | "callsPerBooking"
  | "activeCallingHours"
  | "activeCallingDays"
  | "avgGapBetweenCalls"
  | "bookings"
  | "bookingRate"
  | "bookingTarget"
  | "callTarget"
  // Trend metrics
  | "dailyCallsTrend"
  | "dailyTalkTimeTrend"
  | "successRateTrend"
  | "bookingsTrend"
  // Breakdown metrics
  | "answeredVsMissed"
  | "callsByDayOfWeek"
  | "callsByUser"
  | "bookingsByUser"
  | "bookingsByStage"
  // Tables
  | "recentCalls"
  | "callRecordings"
  | "upcomingMeetings"
  | "meetingPipeline";

export interface WidgetLayout {
  /** Grid column index (0..11) */
  x: number;
  /** Grid row index */
  y: number;
  /** Width in grid units (1..12) */
  w: number;
  /** Height in grid units (1 unit ≈ 60px) */
  h: number;
}

export interface WidgetConfig {
  id: string;
  metric: MetricKey;
  visualization: VisualizationType;
  title: string;
  subtitle?: string;
  format?: DisplayFormat;
  featured?: boolean;
  layout: WidgetLayout;
  /** Optional metric-specific config (e.g. target value, comparison, etc) */
  options?: Record<string, unknown>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  /** ISO date created/updated */
  createdAt: string;
  updatedAt: string;
  /** Built-in preset (cannot be deleted, can be duplicated) */
  isPreset?: boolean;
}

/** Definition of a widget type available in the library */
export interface WidgetDefinition {
  metric: MetricKey;
  category: WidgetCategory;
  title: string;
  description: string;
  /** Visualizations this metric supports — first is the default */
  supportedVisualizations: VisualizationType[];
  defaultFormat?: DisplayFormat;
  defaultLayout: { w: number; h: number };
  /** Tags for search */
  tags?: string[];
  /** Visual accent — references a stat-* token */
  accent?: "blue" | "green" | "teal" | "orange" | "purple" | "rose";
  /** Lucide icon name to render in the KPI header */
  icon?: string;
}
