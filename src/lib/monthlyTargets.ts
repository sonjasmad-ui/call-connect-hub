import { supabase } from "@/integrations/supabase/client";

export type TargetMetric = "bookingTarget" | "callTarget";

/** Returns "YYYY-MM" for a given ISO date string (YYYY-MM-DD). */
export function monthKeyFromDate(isoDate: string): string {
  return (isoDate || "").slice(0, 7);
}

/** Returns the YYYY-MM that best represents the active dashboard range. */
export function monthKeyForRange(startDate: string, endDate: string): string {
  const s = monthKeyFromDate(startDate);
  const e = monthKeyFromDate(endDate);
  // If the range spans multiple months, anchor to the end month (most recent intent).
  return e || s || new Date().toISOString().slice(0, 7);
}

/** Bulk-load every saved target so widgets can resolve per-month values. */
export async function loadAllMonthlyTargets(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("monthly_targets")
    .select("metric, month, value");
  if (error || !data) return {};
  const map: Record<string, number> = {};
  for (const row of data) {
    map[`${row.metric}:${row.month}`] = row.value as number;
  }
  return map;
}

export async function saveMonthlyTarget(
  metric: TargetMetric,
  month: string,
  value: number,
): Promise<void> {
  await supabase
    .from("monthly_targets")
    .upsert(
      { metric, month, value, updated_at: new Date().toISOString() },
      { onConflict: "metric,month" },
    );
}
