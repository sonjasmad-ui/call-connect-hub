import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";
import { dummyMeetings } from "@/data/dummyData";

interface DailyData {
  date: string;
  calls: number;
  answered: number;
  talkTime: number;
}

interface HourlyData {
  hour: string;
  answered: number;
}

interface TrendsChartsProps {
  dailyData: DailyData[];
  hourlyData: HourlyData[];
}

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  background: "hsl(var(--card))",
  padding: "10px 14px",
  fontSize: 12,
};

const gridStyle = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };

export function TrendsCharts({ dailyData, hourlyData }: TrendsChartsProps) {
  const last14 = dailyData.slice(-14);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Calls & Answered */}
      <Card className="p-5 glass-card">
        <div className="mb-4">
          <p className="font-semibold text-foreground">Calls & Answered</p>
          <p className="text-xs text-muted-foreground">Daily volume over 14 days</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={last14}>
            <defs>
              <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="answeredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="calls" name="Total Calls" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#callsGrad)" />
            <Area type="monotone" dataKey="answered" name="Answered" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#answeredGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Talk Time */}
      <Card className="p-5 glass-card">
        <div className="mb-4">
          <p className="font-semibold text-foreground">Talk Time</p>
          <p className="text-xs text-muted-foreground">Daily minutes</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={last14}>
            <defs>
              <linearGradient id="talkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="talkTime" name="Talk time (min)" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#talkGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Best Calling Hours */}
      <Card className="p-5 glass-card">
        <div className="mb-4">
          <p className="font-semibold text-foreground">Best Calling Hours</p>
          <p className="text-xs text-muted-foreground">Answered calls by hour</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={hourlyData} barSize={20}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="answered" name="Answered" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Meeting Pipeline */}
      <Card className="p-5 glass-card">
        <div className="mb-4">
          <p className="font-semibold text-foreground">Meeting Pipeline</p>
          <p className="text-xs text-muted-foreground">Upcoming from Pipedrive</p>
        </div>
        <MeetingPipeline />
      </Card>
    </div>
  );
}

function MeetingPipeline() {
  const stageColors: Record<string, string> = {
    Lead: "bg-[hsl(var(--stat-blue))]/15 text-[hsl(var(--stat-blue))]",
    Discovery: "bg-[hsl(var(--stat-teal))]/15 text-[hsl(var(--stat-teal))]",
    Demo: "bg-[hsl(var(--stat-purple))]/15 text-[hsl(var(--stat-purple))]",
    Proposal: "bg-[hsl(var(--stat-orange))]/15 text-[hsl(var(--stat-orange))]",
    Negotiation: "bg-[hsl(var(--stat-green))]/15 text-[hsl(var(--stat-green))]",
  };

  return (
    <div className="space-y-2.5">
      {dummyMeetings.map((m) => (
        <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]" />
            <div>
              <p className="font-medium text-sm text-foreground">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.contactName} · {m.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColors[m.pipedriveStage] || ""}`}>{m.pipedriveStage}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{m.date} {m.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
