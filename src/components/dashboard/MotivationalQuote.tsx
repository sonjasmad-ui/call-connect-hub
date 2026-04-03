import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const quotes = [
  { text: "Every 'no' brings you closer to a 'yes.'", author: "Mark Cuban" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Sales are contingent upon the attitude of the salesman, not the attitude of the prospect.", author: "W. Clement Stone" },
  { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Hustle beats talent when talent doesn't hustle.", author: "Ross Simmonds" },
  { text: "Stop selling. Start helping.", author: "Zig Ziglar" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
}

export function MotivationalQuote() {
  const [quote] = useState(getDailyQuote);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzB2Mkgydi0yaDM0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-foreground/90 leading-relaxed italic">"{quote.text}"</p>
          <p className="text-xs text-primary-foreground/60 mt-1">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}
