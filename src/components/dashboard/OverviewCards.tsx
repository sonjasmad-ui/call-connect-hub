import { Phone, PhoneCall, TrendingUp, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OverviewCardsProps {
  totalCalls: number;
  answered: number;
  successRate: number;
  totalTalkTimeMinutes: number;
}

const stats = [
  { key: "totalCalls", label: "Total Calls", icon: Phone, gradient: "from-[hsl(var(--stat-blue))] to-[hsl(var(--stat-purple))]", sub: "Last 30 days" },
  { key: "answered", label: "Answered", icon: PhoneCall, gradient: "from-[hsl(var(--stat-green))] to-[hsl(var(--stat-teal))]", sub: null },
  { key: "successRate", label: "Success Rate", icon: TrendingUp, gradient: "from-[hsl(var(--stat-orange))] to-[hsl(var(--stat-rose))]", sub: "Answered / Total" },
  { key: "talkTime", label: "Talk Time", icon: Clock, gradient: "from-[hsl(var(--stat-purple))] to-[hsl(var(--stat-blue))]", sub: "Total minutes" },
] as const;

export function OverviewCards(props: OverviewCardsProps) {
  const getValue = (key: string) => {
    if (key === "talkTime") return `${props.totalTalkTimeMinutes}m`;
    if (key === "successRate") return `${props.successRate}%`;
    return props[key as keyof OverviewCardsProps].toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.key} className="relative overflow-hidden p-5 glass-card hover:shadow-md transition-shadow group">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{s.label}</p>
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
              <s.icon className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{getValue(s.key)}</p>
          {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
        </Card>
      ))}
    </div>
  );
}
