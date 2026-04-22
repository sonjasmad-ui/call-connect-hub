import type { WidgetDefinition, MetricKey, VisualizationType } from "./types";

/**
 * Single source of truth for all widget types.
 * Use `getWidgetDefinition(metric)` everywhere — never hardcode metric metadata.
 */
export const WIDGET_REGISTRY: Record<MetricKey, WidgetDefinition> = {
  // ---------- Calling KPI ----------
  totalCalls: {
    metric: "totalCalls", category: "kpi",
    title: "Total Calls", description: "All calls made",
    supportedVisualizations: ["kpi", "line", "bar"],
    defaultFormat: "integer", defaultLayout: { w: 3, h: 3 },
    tags: ["calls", "volume"], accent: "blue", icon: "Phone",
  },
  answeredCalls: {
    metric: "answeredCalls", category: "kpi",
    title: "Answered Calls", description: "Calls connected",
    supportedVisualizations: ["kpi", "line", "bar"],
    defaultFormat: "integer", defaultLayout: { w: 3, h: 3 },
    tags: ["calls", "answered"], accent: "green", icon: "PhoneCall",
  },
  answerRate: {
    metric: "answerRate", category: "kpi",
    title: "Answer Rate", description: "Answered ÷ Total",
    supportedVisualizations: ["kpi", "line", "progress"],
    defaultFormat: "percent", defaultLayout: { w: 3, h: 3 },
    tags: ["rate", "success"], accent: "teal", icon: "Target",
  },
  talkTime: {
    metric: "talkTime", category: "kpi",
    title: "Talk Time", description: "Total call minutes",
    supportedVisualizations: ["kpi", "line", "bar"],
    defaultFormat: "duration", defaultLayout: { w: 3, h: 3 },
    tags: ["time", "duration"], accent: "purple", icon: "Clock",
  },
  avgTalkTime: {
    metric: "avgTalkTime", category: "kpi",
    title: "Avg Talk Time", description: "Avg per call",
    supportedVisualizations: ["kpi", "line"],
    defaultFormat: "duration", defaultLayout: { w: 3, h: 3 },
    tags: ["time", "average"], accent: "purple", icon: "Timer",
  },
  callsPerActiveHour: {
    metric: "callsPerActiveHour", category: "kpi",
    title: "Calls / Active Hour", description: "Calls per hour",
    supportedVisualizations: ["kpi", "bar"],
    defaultFormat: "decimal", defaultLayout: { w: 3, h: 3 },
    tags: ["productivity"], accent: "orange", icon: "Zap",
  },
  callsPerBooking: {
    metric: "callsPerBooking", category: "kpi",
    title: "Calls / Booking", description: "Calls to book one",
    supportedVisualizations: ["kpi"],
    defaultFormat: "decimal", defaultLayout: { w: 3, h: 3 },
    tags: ["efficiency", "booking"], accent: "teal", icon: "Repeat",
  },
  activeCallingHours: {
    metric: "activeCallingHours", category: "kpi",
    title: "Active Calling Hours", description: "Hours with calls",
    supportedVisualizations: ["kpi"], defaultFormat: "integer",
    defaultLayout: { w: 3, h: 3 }, tags: ["activity"], accent: "blue", icon: "Activity",
  },
  activeCallingDays: {
    metric: "activeCallingDays", category: "kpi",
    title: "Active Calling Days", description: "Days with calls",
    supportedVisualizations: ["kpi"], defaultFormat: "integer",
    defaultLayout: { w: 3, h: 3 }, tags: ["activity"], accent: "blue", icon: "CalendarDays",
  },
  avgGapBetweenCalls: {
    metric: "avgGapBetweenCalls", category: "kpi",
    title: "Avg Gap Between Calls", description: "Idle time between",
    supportedVisualizations: ["kpi"], defaultFormat: "duration",
    defaultLayout: { w: 3, h: 3 }, tags: ["pace", "rhythm"], accent: "orange", icon: "Hourglass",
  },

  // ---------- Booking KPI ----------
  bookings: {
    metric: "bookings", category: "booking",
    title: "Bookings", description: "Meetings booked",
    supportedVisualizations: ["kpi", "line", "bar"],
    defaultFormat: "integer", defaultLayout: { w: 3, h: 3 },
    tags: ["booking", "meeting"], accent: "rose", icon: "CalendarCheck",
  },
  bookingRate: {
    metric: "bookingRate", category: "booking",
    title: "Booking Rate", description: "Bookings per 100 calls",
    supportedVisualizations: ["kpi", "progress"],
    defaultFormat: "percent", defaultLayout: { w: 3, h: 3 },
    tags: ["booking", "rate"], accent: "rose", icon: "TrendingUp",
  },
  bookingTarget: {
    metric: "bookingTarget", category: "booking",
    title: "Booking Target", description: "Progress to goal",
    supportedVisualizations: ["progress", "kpi"],
    defaultFormat: "integer", defaultLayout: { w: 6, h: 3 },
    tags: ["target", "goal"], accent: "rose", icon: "Trophy",
  },
  callTarget: {
    metric: "callTarget", category: "booking",
    title: "Call Target", description: "Progress to goal",
    supportedVisualizations: ["progress", "kpi"],
    defaultFormat: "integer", defaultLayout: { w: 6, h: 3 },
    tags: ["target", "goal"], accent: "blue", icon: "Flag",
  },
  activityPerDay: {
    metric: "activityPerDay", category: "kpi",
    title: "Activity / Day", description: "Calls + meetings",
    supportedVisualizations: ["kpi"],
    defaultFormat: "decimal", defaultLayout: { w: 3, h: 3 },
    tags: ["activity", "ae", "rhythm"], accent: "orange", icon: "Activity",
  },
  pipelineCoverage: {
    metric: "pipelineCoverage", category: "booking",
    title: "Pipeline Coverage", description: "Pipeline ÷ quota",
    supportedVisualizations: ["kpi", "progress"],
    defaultFormat: "percent", defaultLayout: { w: 3, h: 3 },
    tags: ["ae", "pipeline", "quota"], accent: "teal", icon: "TrendingUp",
  },

  // ---------- Trends ----------
  dailyCallsTrend: {
    metric: "dailyCallsTrend", category: "trend",
    title: "Daily Calls Trend", description: "Calls per day",
    supportedVisualizations: ["line", "bar"],
    defaultLayout: { w: 6, h: 5 }, tags: ["trend", "calls"], accent: "blue", icon: "LineChart",
  },
  dailyTalkTimeTrend: {
    metric: "dailyTalkTimeTrend", category: "trend",
    title: "Daily Talk Time", description: "Minutes per day",
    supportedVisualizations: ["line", "bar"],
    defaultLayout: { w: 6, h: 5 }, tags: ["trend", "time"], accent: "purple", icon: "Clock",
  },
  successRateTrend: {
    metric: "successRateTrend", category: "trend",
    title: "Success Rate Trend", description: "Daily answer rate",
    supportedVisualizations: ["line", "bar"], defaultFormat: "percent",
    defaultLayout: { w: 6, h: 5 }, tags: ["trend", "rate"], accent: "teal", icon: "TrendingUp",
  },
  bookingsTrend: {
    metric: "bookingsTrend", category: "trend",
    title: "Bookings Trend", description: "Bookings per day",
    supportedVisualizations: ["line", "bar"],
    defaultLayout: { w: 6, h: 5 }, tags: ["trend", "booking"], accent: "rose", icon: "CalendarCheck",
  },

  // ---------- Breakdowns ----------
  answeredVsMissed: {
    metric: "answeredVsMissed", category: "breakdown",
    title: "Answered vs Missed", description: "Call outcomes",
    supportedVisualizations: ["donut", "bar"],
    defaultLayout: { w: 4, h: 5 }, tags: ["breakdown", "outcome"], accent: "green", icon: "PieChart",
  },
  callsByDayOfWeek: {
    metric: "callsByDayOfWeek", category: "breakdown",
    title: "Calls by Day of Week", description: "By weekday",
    supportedVisualizations: ["bar", "line"],
    defaultLayout: { w: 6, h: 5 }, tags: ["breakdown", "weekday"], accent: "blue", icon: "BarChart3",
  },
  callsByUser: {
    metric: "callsByUser", category: "breakdown",
    title: "Calls by User", description: "Per team member",
    supportedVisualizations: ["bar", "donut", "table"],
    defaultLayout: { w: 6, h: 5 }, tags: ["user", "team"], accent: "blue", icon: "Users",
  },
  bookingsByUser: {
    metric: "bookingsByUser", category: "breakdown",
    title: "Bookings by User", description: "Per team member",
    supportedVisualizations: ["bar", "donut", "table"],
    defaultLayout: { w: 6, h: 5 }, tags: ["user", "booking"], accent: "rose", icon: "Users",
  },
  bookingsByStage: {
    metric: "bookingsByStage", category: "breakdown",
    title: "Bookings by Stage", description: "By pipeline stage",
    supportedVisualizations: ["donut", "bar"],
    defaultLayout: { w: 4, h: 5 }, tags: ["pipeline", "stage"], accent: "purple", icon: "Layers",
  },

  // ---------- Tables ----------
  recentCalls: {
    metric: "recentCalls", category: "table",
    title: "Recent Calls", description: "Latest activity",
    supportedVisualizations: ["table"],
    defaultLayout: { w: 12, h: 6 }, tags: ["table", "calls"], accent: "blue", icon: "Phone",
  },
  callRecordings: {
    metric: "callRecordings", category: "table",
    title: "Call Recordings", description: "With recordings",
    supportedVisualizations: ["table"],
    defaultLayout: { w: 12, h: 6 }, tags: ["table", "recording"], accent: "purple", icon: "Mic",
  },
  upcomingMeetings: {
    metric: "upcomingMeetings", category: "table",
    title: "Upcoming Meetings", description: "Scheduled ahead",
    supportedVisualizations: ["table"],
    defaultLayout: { w: 6, h: 5 }, tags: ["table", "meeting"], accent: "rose", icon: "Calendar",
  },
  meetingPipeline: {
    metric: "meetingPipeline", category: "table",
    title: "Meeting Pipeline", description: "With stages",
    supportedVisualizations: ["table"],
    defaultLayout: { w: 6, h: 5 }, tags: ["pipeline", "meeting"], accent: "purple", icon: "GitBranch",
  },
};

export function getWidgetDefinition(metric: MetricKey): WidgetDefinition {
  return WIDGET_REGISTRY[metric];
}

export function getAllWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}

export function isValidVisualization(metric: MetricKey, viz: VisualizationType): boolean {
  return WIDGET_REGISTRY[metric].supportedVisualizations.includes(viz);
}

export const ACCENT_HSL: Record<NonNullable<WidgetDefinition["accent"]>, string> = {
  blue:   "var(--stat-blue)",
  green:  "var(--stat-green)",
  teal:   "var(--stat-teal)",
  orange: "var(--stat-orange)",
  purple: "var(--stat-purple)",
  rose:   "var(--stat-rose)",
};
