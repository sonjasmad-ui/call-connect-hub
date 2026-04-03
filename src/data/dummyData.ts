// Dummy data simulating Telavox + Pipedrive integration

export interface CallRecord {
  id: string;
  date: string;
  time: string;
  direction: "outbound" | "inbound";
  duration: number; // seconds
  status: "answered" | "missed" | "voicemail" | "busy";
  connected: boolean; // spoke 10s+
  contactName: string;
  company: string;
  phone: string;
  recordingUrl?: string;
  notes?: string;
  source: "telavox" | "pipedrive";
}

export interface Meeting {
  id: string;
  title: string;
  contactName: string;
  company: string;
  date: string;
  time: string;
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
  startDate: string;
  endDate: string;
  user: string;
  source: string;
  direction: string;
  status: string;
}

export const defaultFilters: DashboardFilters = {
  startDate: "2026-03-02",
  endDate: "2026-04-03",
  user: "all",
  source: "all",
  direction: "all",
  status: "all",
};

const names = ["John Doe", "Jane Smith", "Mike Johnson", "Sara Wilson", "Tom Brown", "Lisa Chen", "David Park", "Emma Davis"];
const companies = ["Acme Corp", "Stark Ind.", "Wayne Ent.", "Globex Corp", "Initech", "Umbrella Co", "Cyberdyne", "Wonka Ind."];

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
      const connected = answered && duration > 10;

      calls.push({
        id: `call-${d.toISOString().slice(0, 10)}-${i}`,
        date: d.toISOString().slice(0, 10),
        time: `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`,
        direction: Math.random() > 0.15 ? "outbound" : "inbound",
        duration,
        status,
        connected,
        contactName: randomFrom(names),
        company: randomFrom(companies),
        phone: `+45 ${Math.floor(10000000 + Math.random() * 90000000)}`,
        recordingUrl: answered ? `https://recordings.telavox.example/rec-${Date.now()}-${i}` : undefined,
        notes: Math.random() > 0.7 ? "Interested in demo" : undefined,
        source: Math.random() > 0.3 ? "telavox" : "pipedrive",
      });
    }
  }
  return calls;
}

function generateMeetings(): Meeting[] {
  return [
    { id: "m1", title: "Discovery Call", contactName: "John Doe", company: "Acme Corp", date: "2026-04-04", time: "14:00", pipedriveStage: "Discovery", dealValue: 45000 },
    { id: "m2", title: "Follow up", contactName: "Jane Smith", company: "Stark Ind.", date: "2026-04-05", time: "10:30", pipedriveStage: "Proposal", dealValue: 32000 },
    { id: "m3", title: "Demo", contactName: "Mike Johnson", company: "Wayne Ent.", date: "2026-04-07", time: "09:00", pipedriveStage: "Demo", dealValue: 78000 },
    { id: "m4", title: "Closing Call", contactName: "Sara Wilson", company: "Globex Corp", date: "2026-04-08", time: "15:30", pipedriveStage: "Negotiation", dealValue: 55000 },
    { id: "m5", title: "Intro Meeting", contactName: "Lisa Chen", company: "Initech", date: "2026-04-09", time: "11:00", pipedriveStage: "Lead", dealValue: 28000 },
  ];
}

export const dummyCalls = generateCalls();
export const dummyMeetings = generateMeetings();

export const defaultSavedViews: SavedView[] = [
  { id: "v1", name: "Last 30 days — All", filters: defaultFilters, isDefault: true },
  { id: "v2", name: "This week", filters: { ...defaultFilters, startDate: "2026-03-31", endDate: "2026-04-03" } },
  { id: "v3", name: "Outbound only", filters: { ...defaultFilters, direction: "outbound" } },
];

// Aggregation helpers
export function getOverviewStats(calls: CallRecord[]) {
  const total = calls.length;
  const answered = calls.filter(c => c.status === "answered").length;
  const connected = calls.filter(c => c.connected).length;
  const totalTalkTime = calls.reduce((sum, c) => sum + (c.status === "answered" ? c.duration : 0), 0);

  return {
    totalCalls: total,
    answered,
    connected,
    pickupRate: total > 0 ? Math.round((answered / total) * 100) : 0,
    connectRate: total > 0 ? Math.round((connected / total) * 100) : 0,
    totalTalkTimeMinutes: Math.round(totalTalkTime / 60),
  };
}

export function getDailyData(calls: CallRecord[]) {
  const byDate: Record<string, { calls: number; connected: number; talkTime: number }> = {};
  calls.forEach(c => {
    if (!byDate[c.date]) byDate[c.date] = { calls: 0, connected: 0, talkTime: 0 };
    byDate[c.date].calls++;
    if (c.connected) byDate[c.date].connected++;
    if (c.status === "answered") byDate[c.date].talkTime += c.duration;
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      rawDate: date,
      calls: data.calls,
      connected: data.connected,
      talkTime: Math.round(data.talkTime / 60),
    }));
}

export function getHourlyData(calls: CallRecord[]) {
  const byHour: Record<number, number> = {};
  calls.filter(c => c.connected).forEach(c => {
    const hour = parseInt(c.time.split(":")[0]);
    byHour[hour] = (byHour[hour] || 0) + 1;
  });
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${(8 + i).toString().padStart(2, "0")}:00`,
    connects: byHour[8 + i] || 0,
  }));
}

export function filterCalls(calls: CallRecord[], filters: DashboardFilters): CallRecord[] {
  return calls.filter(c => {
    if (c.date < filters.startDate || c.date > filters.endDate) return false;
    if (filters.direction !== "all" && c.direction !== filters.direction) return false;
    if (filters.status !== "all" && c.status !== filters.status) return false;
    if (filters.source !== "all" && c.source !== filters.source) return false;
    return true;
  });
}
