/**
 * Compute metric values from the dashboard data sources.
 * Single place where raw calls/meetings turn into widget-ready data.
 */
import type { CallRecord, Meeting } from "@/data/dummyData";

export interface MetricInputs {
  calls: CallRecord[];
  meetings: Meeting[];
  startDate: string;
  endDate: string;
  bookingTarget: number;
  callTarget: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toMin(seconds: number): number {
  return seconds / 60;
}

export function computeScalar(metric: string, input: MetricInputs): number {
  const { calls, meetings, startDate, endDate, bookingTarget, callTarget } = input;
  const total = calls.length;
  const answered = calls.filter(c => c.status === "answered");
  const answeredCount = answered.length;
  const talkTimeSec = answered.reduce((s, c) => s + c.duration, 0);
  const bookingsInPeriod = meetings.filter(m => {
    const d = m.createdDate || m.date;
    return d >= startDate && d <= endDate;
  }).length;

  switch (metric) {
    case "totalCalls":     return total;
    case "answeredCalls":  return answeredCount;
    case "answerRate":     return total > 0 ? (answeredCount / total) * 100 : 0;
    case "talkTime":       return toMin(talkTimeSec);
    case "avgTalkTime":    return answeredCount > 0 ? toMin(talkTimeSec / answeredCount) : 0;
    case "bookings":       return bookingsInPeriod;
    case "bookingRate":    return total > 0 ? (bookingsInPeriod / total) * 100 : 0;
    case "callsPerBooking":return bookingsInPeriod > 0 ? total / bookingsInPeriod : 0;
    case "bookingTarget":  return bookingsInPeriod;
    case "callTarget":     return total;
    case "activeCallingHours": {
      const set = new Set<string>();
      calls.forEach(c => set.add(`${c.date}-${c.time.split(":")[0]}`));
      return set.size;
    }
    case "activeCallingDays": {
      const set = new Set(calls.map(c => c.date));
      return set.size;
    }
    case "callsPerActiveHour": {
      const set = new Set<string>();
      calls.forEach(c => set.add(`${c.date}-${c.time.split(":")[0]}`));
      return set.size > 0 ? total / set.size : 0;
    }
    case "avgGapBetweenCalls": {
      if (calls.length < 2) return 0;
      const sorted = [...calls].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
      );
      let totalGap = 0;
      let count = 0;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(`${sorted[i - 1].date}T${sorted[i - 1].time}:00`).getTime();
        const cur = new Date(`${sorted[i].date}T${sorted[i].time}:00`).getTime();
        const gapMin = (cur - prev) / 60000;
        if (gapMin > 0 && gapMin < 240) {
          totalGap += gapMin;
          count++;
        }
      }
      return count > 0 ? totalGap / count : 0;
    }
    default:
      return 0;
  }
}

export function computeTarget(metric: string): number | null {
  // Returns the target denominator for progress widgets.
  return null;
}

/** Trend metrics → array of { date, value } */
export function computeTrend(metric: string, input: MetricInputs): Array<{ date: string; value: number }> {
  const { calls, meetings } = input;
  const byDate: Record<string, { calls: number; answered: number; talk: number; bookings: number }> = {};

  for (const c of calls) {
    if (!byDate[c.date]) byDate[c.date] = { calls: 0, answered: 0, talk: 0, bookings: 0 };
    byDate[c.date].calls++;
    if (c.status === "answered") {
      byDate[c.date].answered++;
      byDate[c.date].talk += c.duration;
    }
  }
  for (const m of meetings) {
    const d = m.createdDate || m.date;
    if (d >= input.startDate && d <= input.endDate) {
      if (!byDate[d]) byDate[d] = { calls: 0, answered: 0, talk: 0, bookings: 0 };
      byDate[d].bookings++;
    }
  }

  const sorted = Object.keys(byDate).sort();
  return sorted.map(date => {
    const v = byDate[date];
    let value = 0;
    switch (metric) {
      case "dailyCallsTrend":      value = v.calls; break;
      case "dailyTalkTimeTrend":   value = Math.round(v.talk / 60); break;
      case "successRateTrend":     value = v.calls > 0 ? Math.round((v.answered / v.calls) * 100) : 0; break;
      case "bookingsTrend":        value = v.bookings; break;
    }
    return {
      date: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value,
    };
  });
}

/** Breakdown metrics → array of { name, value } */
export function computeBreakdown(metric: string, input: MetricInputs): Array<{ name: string; value: number }> {
  const { calls, meetings } = input;

  switch (metric) {
    case "answeredVsMissed": {
      const answered = calls.filter(c => c.status === "answered").length;
      const missed = calls.filter(c => c.status === "missed").length;
      const other = calls.length - answered - missed;
      return [
        { name: "Answered", value: answered },
        { name: "Missed", value: missed },
        { name: "Other", value: other },
      ].filter(d => d.value > 0);
    }
    case "callsByDayOfWeek": {
      const counts = new Array(7).fill(0);
      calls.forEach(c => {
        const d = new Date(c.date).getDay();
        counts[d]++;
      });
      // Monday-first
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.map(i => ({ name: WEEKDAYS[i], value: counts[i] }));
    }
    case "bookingsByStage": {
      const map: Record<string, number> = {};
      meetings
        .filter(m => {
          const d = m.createdDate || m.date;
          return d >= input.startDate && d <= input.endDate;
        })
        .forEach(m => {
          map[m.pipedriveStage] = (map[m.pipedriveStage] || 0) + 1;
        });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    }
    case "callsByUser":
    case "bookingsByUser":
      // Live data may include user info; without it, return a placeholder.
      return [];
    default:
      return [];
  }
}

/** Table metrics → opaque rows; widget renderer knows how to render each. */
export function computeTableRows(metric: string, input: MetricInputs): Array<Record<string, unknown>> {
  switch (metric) {
    case "recentCalls":
    case "callRecordings": {
      const rows = metric === "callRecordings"
        ? input.calls.filter(c => c.recordingUrl)
        : input.calls;
      return [...rows].sort((a, b) =>
        `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
      );
    }
    case "upcomingMeetings":
      return input.meetings
        .filter(m => m.date >= input.startDate)
        .sort((a, b) => a.date.localeCompare(b.date));
    case "meetingPipeline":
      return input.meetings;
    default:
      return [];
  }
}
