import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
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
  border: "1px solid hsl(var(--border))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  background: "hsl(var(--card))",
};

export function TrendsCharts({ dailyData, hourlyData }: TrendsChartsProps) {
  const last14 = dailyData.slice(-14);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5 glass-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-semibold text-foreground">Calls & Answered</p>
            <p className="text-xs text-muted-foreground">Daily volume over 14 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={last14} barGap={2}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="calls" name="Total Calls" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Bar dataKey="answered" name="Answered" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5 glass-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-semibold text-foreground">Talk Time</p>
            <p className="text-xs text-muted-foreground">Daily minutes</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={last14}>
            <defs>
              <linearGradient id="talkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}m`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="talkTime" name="Talk time (min)" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#talkGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5 glass-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-semibold text-foreground">Best Calling Hours</p>
            <p className="text-xs text-muted-foreground">Answered calls by hour</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hourlyData}>
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="answered" name="Answered" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5 glass-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-semibold text-foreground">Meeting Pipeline</p>
            <p className="text-xs text-muted-foreground">Upcoming from Pipedrive</p>
          </div>
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
    <div className="space-y-3">
      {dummyMeetings.map((m) => (
        <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
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
