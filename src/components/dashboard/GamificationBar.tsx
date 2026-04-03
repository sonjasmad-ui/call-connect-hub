import { Flame, Trophy, Zap, Star } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GamificationBarProps {
  totalCalls: number;
  answered: number;
  bookings: number;
  successRate: number;
}

interface Achievement {
  icon: React.ElementType;
  label: string;
  description: string;
  unlocked: boolean;
  gradient: string;
}

export function GamificationBar({ totalCalls, answered, bookings, successRate }: GamificationBarProps) {
  // Streak: simulated daily streak
  const streak = 7;

  // XP system
  const xp = totalCalls * 2 + answered * 5 + bookings * 50;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;

  const achievements: Achievement[] = [
    { icon: Flame, label: "Hot Streak", description: `${streak} day streak`, unlocked: streak >= 3, gradient: "from-[hsl(var(--stat-orange))] to-[hsl(var(--stat-rose))]" },
    { icon: Trophy, label: "Century Club", description: "100+ calls", unlocked: totalCalls >= 100, gradient: "from-[hsl(var(--stat-green))] to-[hsl(var(--stat-teal))]" },
    { icon: Zap, label: "Sharpshooter", description: "50%+ success", unlocked: successRate >= 50, gradient: "from-[hsl(var(--stat-blue))] to-[hsl(var(--stat-purple))]" },
    { icon: Star, label: "Closer", description: "10+ bookings", unlocked: bookings >= 10, gradient: "from-[hsl(var(--stat-purple))] to-[hsl(var(--stat-rose))]" },
  ];

  return (
    <Card className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Level & XP */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">{level}</span>
          </div>
          <div className="min-w-[120px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level {level}</p>
            <div className="h-2 bg-muted rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full gradient-bar transition-all duration-500"
                style={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{xpInLevel} / {xpToNext} XP</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--stat-orange))]/10">
          <Flame className="h-5 w-5 text-[hsl(var(--stat-orange))]" />
          <div>
            <p className="text-sm font-bold text-foreground">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-2 ml-auto">
          {achievements.map((a) => (
            <div
              key={a.label}
              title={`${a.label}: ${a.description}`}
              className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                a.unlocked
                  ? `bg-gradient-to-br ${a.gradient} shadow-md`
                  : "bg-muted/60 opacity-40"
              }`}
            >
              <a.icon className={`h-4.5 w-4.5 ${a.unlocked ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
