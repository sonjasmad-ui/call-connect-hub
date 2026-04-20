import type { DisplayFormat } from "./types";

export function formatValue(value: number | null | undefined, format?: DisplayFormat): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";

  switch (format) {
    case "percent":
      return `${Math.round(value)}%`;
    case "duration":
      return formatDuration(value);
    case "decimal":
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    case "currency":
      return value.toLocaleString(undefined, { style: "currency", currency: "DKK", maximumFractionDigits: 0 });
    case "integer":
    default:
      return Math.round(value).toLocaleString();
  }
}

/** Input: minutes. Output: "1h 24m" or "12m" */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
