export interface CallRecord {
  id: string;
  date: string;
  time: string;
  direction: "outbound" | "inbound";
  duration: number;
  status: "answered" | "missed" | "voicemail" | "busy";
  phone: string;
  recordingUrl?: string;
  notes?: string;
  /** Enriched from Pipedrive contact lookup when available */
  contactName?: string;
  company?: string;
  userName?: string;
}

export interface Meeting {
  id: string;
  title: string;
  contactName: string;
  company: string;
  date: string;
  time: string;
  createdDate: string;
  pipedriveStage: string;
  dealValue?: number;
}

export interface SavedView {
  id: string;
  name: string;
  filters: DashboardFilters;
  isDefault?: boolean;
}

export interface DashboardFilters {
  datePreset: string;
  startDate: string;
  endDate: string;
  direction: string;
  status: string;
}

export const defaultFilters: DashboardFilters = {
  datePreset: "last30",
  startDate: "2026-03-04",
  endDate: "2026-04-03",
  direction: "all",
  status: "all",
};

const phones = ["+45 20123456", "+45 31234567", "+45 42345678", "+45 53456789", "+45 60987654", "+45 71098765", "+45 82109876", "+45 93210987"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCalls(): CallRecord[] {
  const calls: CallRecord[] = [];
  const startDate = new Date("2026-03-02");
  const endDate = new Date("2026-04-03");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dailyCalls = 25 + Math.floor(Math.random() * 40);
    for (let i = 0; i < dailyCalls; i++) {
      const hour = 8 + Math.floor(Math.random() * 12);
      const min = Math.floor(Math.random() * 60);
      const statuses: CallRecord["status"][] = ["answered", "answered", "answered", "missed", "busy", "voicemail"];
      const status = randomFrom(statuses);
      const answered = status === "answered";
      const duration = answered ? 15 + Math.floor(Math.random() * 480) : Math.floor(Math.random() * 10);

      calls.push({
        id: `call-${d.toISOString().slice(0, 10)}-${i}`,
        date: d.toISOString().slice(0, 10),
        time: `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`,
        direction: Math.random() > 0.15 ? "outbound" : "inbound",
        duration,
        status,
        phone: randomFrom(phones),
        recordingUrl: answered ? `https://recordings.telavox.example/rec-${Date.now()}-${i}` : undefined,
        notes: Math.random() > 0.7 ? "Interested in demo" : undefined,
      });
    }
  }
  return calls;
}

function generateMeetings(): Meeting[] {
  return [
    { id: "m1", title: "Discovery Call", contactName: "John Doe", company: "Acme Corp", date: "2026-04-04", time: "14:00", createdDate: "2026-03-20", pipedriveStage: "Discovery", dealValue: 45000 },
    { id: "m2", title: "Follow up", contactName: "Jane Smith", company: "Stark Ind.", date: "2026-04-05", time: "10:30", createdDate: "2026-03-22", pipedriveStage: "Proposal", dealValue: 32000 },
    { id: "m3", title: "Demo", contactName: "Mike Johnson", company: "Wayne Ent.", date: "2026-04-07", time: "09:00", createdDate: "2026-03-15", pipedriveStage: "Demo", dealValue: 78000 },
    { id: "m4", title: "Closing Call", contactName: "Sara Wilson", company: "Globex Corp", date: "2026-04-08", time: "15:30", createdDate: "2026-04-01", pipedriveStage: "Negotiation", dealValue: 55000 },
    { id: "m5", title: "Intro Meeting", contactName: "Lisa Chen", company: "Initech", date: "2026-04-09", time: "11:00", createdDate: "2026-04-02", pipedriveStage: "Lead", dealValue: 28000 },
  ];
}

export const dummyCalls = generateCalls();
export const dummyMeetings = generateMeetings();

export const defaultSavedViews: SavedView[] = [
  { id: "v1", name: "Last 30 days", filters: defaultFilters, isDefault: true },
  { id: "v2", name: "This week", filters: { ...defaultFilters, datePreset: "last7", startDate: "2026-03-27", endDate: "2026-04-03" } },
  { id: "v3", name: "Outbound only", filters: { ...defaultFilters, direction: "outbound" } },
];

export function getOverviewStats(calls: CallRecord[]) {
  const total = calls.length;
  const answered = calls.filter(c => c.status === "answered").length;
  const totalTalkTime = calls.reduce((sum, c) => sum + (c.status === "answered" ? c.duration : 0), 0);

  return {
    totalCalls: total,
    answered,
    successRate: total > 0 ? Math.round((answered / total) * 100) : 0,
    totalTalkTimeMinutes: Math.round(totalTalkTime / 60),
  };
}

export function getDailyData(calls: CallRecord[]) {
  const byDate: Record<string, { calls: number; answered: number; talkTime: number }> = {};
  calls.forEach(c => {
    if (!byDate[c.date]) byDate[c.date] = { calls: 0, answered: 0, talkTime: 0 };
    byDate[c.date].calls++;
    if (c.status === "answered") {
      byDate[c.date].answered++;
      byDate[c.date].talkTime += c.duration;
    }
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      rawDate: date,
      calls: data.calls,
      answered: data.answered,
      talkTime: Math.round(data.talkTime / 60),
    }));
}

export function getHourlyData(calls: CallRecord[]) {
  const byHour: Record<number, number> = {};
  calls.filter(c => c.status === "answered").forEach(c => {
    const hour = parseInt(c.time.split(":")[0]);
    byHour[hour] = (byHour[hour] || 0) + 1;
  });
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${(8 + i).toString().padStart(2, "0")}:00`,
    answered: byHour[8 + i] || 0,
  }));
}

export function filterCalls(calls: CallRecord[], filters: DashboardFilters): CallRecord[] {
  return calls.filter(c => {
    if (c.date < filters.startDate || c.date > filters.endDate) return false;
    if (filters.direction !== "all" && c.direction !== filters.direction) return false;
    if (filters.status !== "all" && c.status !== filters.status) return false;
    return true;
  });
}

export function getDateRange(preset: string): { startDate: string; endDate: string } {
  const today = new Date("2026-04-03");
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const end = fmt(today);

  switch (preset) {
    case "today":
      return { startDate: end, endDate: end };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { startDate: fmt(y), endDate: fmt(y) };
    }
    case "last7": {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { startDate: fmt(s), endDate: end };
    }
    case "last14": {
      const s = new Date(today);
      s.setDate(s.getDate() - 13);
      return { startDate: fmt(s), endDate: end };
    }
    case "last30": {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { startDate: fmt(s), endDate: end };
    }
    case "thisMonth":
      return { startDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`, endDate: end };
    default:
      return { startDate: "2026-03-04", endDate: end };
  }
}
