import type { DashboardConfig, WidgetConfig } from "./types";
import { getWidgetDefinition } from "./registry";

function makeWidget(
  id: string,
  metric: WidgetConfig["metric"],
  layout: WidgetConfig["layout"],
  overrides: Partial<WidgetConfig> = {},
): WidgetConfig {
  const def = getWidgetDefinition(metric);
  return {
    id,
    metric,
    visualization: overrides.visualization ?? def.supportedVisualizations[0],
    title: overrides.title ?? def.title,
    subtitle: overrides.subtitle,
    format: overrides.format ?? def.defaultFormat,
    featured: overrides.featured,
    layout,
    options: overrides.options,
  };
}

export function SEED_DASHBOARDS(): DashboardConfig[] {
  const now = new Date().toISOString();

  const overview: DashboardConfig = {
    id: "preset_overview",
    name: "Default Overview",
    description: "Your everyday snapshot — calls, bookings, trends.",
    isPreset: true,
    createdAt: now,
    updatedAt: now,
    widgets: [
      // Top row: 5 KPI cards
      makeWidget("w1", "totalCalls",    { x: 0,  y: 0, w: 3, h: 3 }),
      makeWidget("w2", "answeredCalls", { x: 3,  y: 0, w: 3, h: 3 }),
      makeWidget("w3", "answerRate",    { x: 6,  y: 0, w: 3, h: 3 }, { featured: true }),
      makeWidget("w4", "talkTime",      { x: 9,  y: 0, w: 3, h: 3 }),
      // Targets row
      makeWidget("w5", "bookingTarget", { x: 0,  y: 3, w: 6, h: 3 }, { visualization: "progress" }),
      makeWidget("w6", "callTarget",    { x: 6,  y: 3, w: 6, h: 3 }, { visualization: "progress" }),
      // Trends + breakdown
      makeWidget("w7", "dailyCallsTrend",   { x: 0, y: 6, w: 8, h: 5 }),
      makeWidget("w8", "answeredVsMissed",  { x: 8, y: 6, w: 4, h: 5 }, { visualization: "donut" }),
      // Recent calls table
      makeWidget("w9", "recentCalls",   { x: 0, y: 11, w: 12, h: 7 }),
    ],
  };

  const calling: DashboardConfig = {
    id: "preset_calling",
    name: "Calling Performance",
    description: "Volume, pace, and where time is going.",
    isPreset: true,
    createdAt: now,
    updatedAt: now,
    widgets: [
      makeWidget("c1", "totalCalls",       { x: 0, y: 0, w: 3, h: 3 }, { featured: true }),
      makeWidget("c2", "talkTime",         { x: 3, y: 0, w: 3, h: 3 }),
      makeWidget("c3", "avgTalkTime",      { x: 6, y: 0, w: 3, h: 3 }),
      makeWidget("c4", "callsPerActiveHour",{ x: 9, y: 0, w: 3, h: 3 }),
      makeWidget("c5", "dailyCallsTrend",  { x: 0, y: 3, w: 6, h: 5 }),
      makeWidget("c6", "dailyTalkTimeTrend",{ x: 6, y: 3, w: 6, h: 5 }),
      makeWidget("c7", "callsByDayOfWeek", { x: 0, y: 8, w: 6, h: 5 }, { visualization: "bar" }),
      makeWidget("c8", "callsByUser",      { x: 6, y: 8, w: 6, h: 5 }, { visualization: "bar" }),
    ],
  };

  const booking: DashboardConfig = {
    id: "preset_booking",
    name: "Booking Efficiency",
    description: "How efficiently calls become meetings.",
    isPreset: true,
    createdAt: now,
    updatedAt: now,
    widgets: [
      makeWidget("b1", "bookings",       { x: 0, y: 0, w: 3, h: 3 }, { featured: true }),
      makeWidget("b2", "bookingRate",    { x: 3, y: 0, w: 3, h: 3 }),
      makeWidget("b3", "callsPerBooking",{ x: 6, y: 0, w: 3, h: 3 }),
      makeWidget("b4", "answerRate",     { x: 9, y: 0, w: 3, h: 3 }),
      makeWidget("b5", "bookingTarget",  { x: 0, y: 3, w: 6, h: 3 }, { visualization: "progress" }),
      makeWidget("b6", "callTarget",     { x: 6, y: 3, w: 6, h: 3 }, { visualization: "progress" }),
      makeWidget("b7", "bookingsTrend",  { x: 0, y: 6, w: 8, h: 5 }),
      makeWidget("b8", "bookingsByStage",{ x: 8, y: 6, w: 4, h: 5 }, { visualization: "donut" }),
      makeWidget("b9", "meetingPipeline",{ x: 0, y: 11, w: 12, h: 5 }),
    ],
  };

  const quality: DashboardConfig = {
    id: "preset_quality",
    name: "Conversation Quality",
    description: "Depth of conversations and recordings.",
    isPreset: true,
    createdAt: now,
    updatedAt: now,
    widgets: [
      makeWidget("q1", "avgTalkTime",   { x: 0, y: 0, w: 3, h: 3 }, { featured: true }),
      makeWidget("q2", "talkTime",      { x: 3, y: 0, w: 3, h: 3 }),
      makeWidget("q3", "answerRate",    { x: 6, y: 0, w: 3, h: 3 }),
      makeWidget("q4", "answeredCalls", { x: 9, y: 0, w: 3, h: 3 }),
      makeWidget("q5", "successRateTrend",{ x: 0, y: 3, w: 6, h: 5 }),
      makeWidget("q6", "dailyTalkTimeTrend",{ x: 6, y: 3, w: 6, h: 5 }),
      makeWidget("q7", "callRecordings",{ x: 0, y: 8, w: 12, h: 6 }),
    ],
  };

  return [overview, calling, booking, quality];
}
