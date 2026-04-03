import { Phone, PhoneCall, Plug, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OverviewCardsProps {
  totalCalls: number;
  answered: number;
  connected: number;
  pickupRate: number;
  connectRate: number;
  totalTalkTimeMinutes: number;
}

const stats = [
  { key: "totalCalls", label: "TOTAL CALLS", icon: Phone, color: "bg-stat-blue", sub: "Last 30 days" },
  { key: "answered", label: "ANSWERED", icon: PhoneCall, color: "bg-stat-green", sub: (p: OverviewCardsProps) => `${p.pickupRate}% pickup rate` },
  { key: "connected", label: "CONNECTED", icon: Plug, color: "bg-stat-teal", sub: (p: OverviewCardsProps) => `${p.connectRate}% connect rate` },
  { key: "talkTime", label: "TALK TIME", icon: Clock, color: "bg-stat-purple", sub: "Total minutes" },
] as const;

export function OverviewCards(props: OverviewCardsProps) {
  const getValue = (key: string) => {
    if (key === "talkTime") return `${props.totalTalkTimeMinutes}m`;
    return props[key as keyof OverviewCardsProps].toLocaleString();
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">OVERVIEW</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.key} className="relative overflow-hidden p-5">
            <div className={`absolute top-0 left-0 right-0 h-1 ${s.color}`} />
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground">{getValue(s.key)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {typeof s.sub === "function" ? s.sub(props) : s.sub}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
