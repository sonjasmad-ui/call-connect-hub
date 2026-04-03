import { Phone, PhoneCall, TrendingUp, Clock, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OverviewCardsProps {
  totalCalls: number;
  answered: number;
  successRate: number;
  totalTalkTimeMinutes: number;
  bookings: number;
  onBookingsClick?: () => void;
}

const stats = [
  { key: "totalCalls", label: "Total Calls", icon: Phone, gradient: "from-[hsl(var(--stat-blue))] to-[hsl(var(--stat-purple))]", sub: "Last 30 days" },
  { key: "answered", label: "Answered", icon: PhoneCall, gradient: "from-[hsl(var(--stat-green))] to-[hsl(var(--stat-teal))]", sub: null },
  { key: "successRate", label: "Success Rate", icon: TrendingUp, gradient: "from-[hsl(var(--stat-orange))] to-[hsl(var(--stat-rose))]", sub: "Answered / Total" },
  { key: "talkTime", label: "Talk Time", icon: Clock, gradient: "from-[hsl(var(--stat-purple))] to-[hsl(var(--stat-blue))]", sub: "Total minutes" },
  { key: "bookings", label: "Bookings", icon: CalendarCheck, gradient: "from-[hsl(var(--stat-teal))] to-[hsl(var(--stat-green))]", sub: "Click to view", clickable: true },
] as const;

export function OverviewCards(props: OverviewCardsProps) {
  const getValue = (key: string) => {
    if (key === "talkTime") return `${props.totalTalkTimeMinutes}m`;
    if (key === "successRate") return `${props.successRate}%`;
    if (key === "bookings") return props.bookings.toString();
    return props[key as keyof OverviewCardsProps]?.toLocaleString?.() ?? "0";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => {
        const isClickable = "clickable" in s && s.clickable;
        return (
          <Card
            key={s.key}
            className={`relative overflow-hidden p-4 glass-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group ${isClickable ? "cursor-pointer" : ""}`}
            onClick={isClickable ? props.onBookingsClick : undefined}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{s.label}</p>
              <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
                <s.icon className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{getValue(s.key)}</p>
            {s.sub && <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>}
          </Card>
        );
      })}
    </div>
  );
}
