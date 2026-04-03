import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { dummyMeetings } from "@/data/dummyData";
interface DailyData {
  date: string;
  calls: number;
  connected: number;
  talkTime: number;
}

interface HourlyData {
  hour: string;
  connects: number;
}

interface TrendsChartsProps {
  dailyData: DailyData[];
  hourlyData: HourlyData[];
}

export function TrendsCharts({ dailyData, hourlyData }: TrendsChartsProps) {
  const last14 = dailyData.slice(-14);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">TRENDS</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-semibold text-foreground">Calls vs bookings</p>
            <span className="text-sm text-muted-foreground">Last 14 days</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last14} barGap={2}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="calls" name="Calls" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="connected" name="Connected 10s+" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-semibold text-foreground">Talk time</p>
            <span className="text-sm text-muted-foreground">Daily minutes</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last14}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}m`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="talkTime" name="Talk time (min)" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-semibold text-foreground">Best calling hours</p>
            <span className="text-sm text-muted-foreground">Connect volume by hour</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="connects" name="Connects" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-semibold text-foreground">Meeting pipeline</p>
            <span className="text-sm text-muted-foreground">Upcoming from Pipedrive</span>
          </div>
          <MeetingPipeline />
        </Card>
      </div>
    </div>
  );
}

function MeetingPipeline() {
  return (
    <div className="space-y-4">
      {dummyMeetings.map((m: any) => (
        <div key={m.id} className="flex justify-between items-start border-b border-border pb-3 last:border-0">
          <div>
            <p className="font-medium text-foreground">{m.title}</p>
            <p className="text-sm text-muted-foreground">{m.contactName} · {m.company}</p>
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">{m.date} {m.time}</span>
        </div>
      ))}
    </div>
  );
}
