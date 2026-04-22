import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, User, CalendarDays, Search, Layers } from "lucide-react";
import type { Meeting } from "@/data/dummyData";

interface BookingsListDialogProps {
  open: boolean;
  onClose: () => void;
  meetings: Meeting[];
  startDate: string;
  endDate: string;
}

export function BookingsListDialog({ open, onClose, meetings, startDate, endDate }: BookingsListDialogProps) {
  const [query, setQuery] = useState("");

  const inPeriod = useMemo(() => {
    return meetings
      .filter(m => {
        const d = m.createdDate || m.date;
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => (b.createdDate || b.date).localeCompare(a.createdDate || a.date));
  }, [meetings, startDate, endDate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inPeriod;
    return inPeriod.filter(m =>
      m.company?.toLowerCase().includes(q) ||
      m.contactName?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      m.pipedriveStage?.toLowerCase().includes(q),
    );
  }, [inPeriod, query]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 pt-6 pb-4 gradient-bar text-primary-foreground shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Bookings · {inPeriod.length}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/85 text-xs">
              Companies booked between {startDate} and {endDate}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search company, contact or stage…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {query ? "No bookings match your search." : "No bookings in this period yet."}
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map(m => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-[hsl(var(--stat-rose))]/12 text-[hsl(var(--stat-rose))] flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.company || <span className="italic text-muted-foreground">No company</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                      <User className="h-3 w-3 shrink-0" />
                      {m.contactName || "Unknown contact"}
                      <span className="opacity-50">·</span>
                      <span className="truncate">{m.title}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Layers className="h-2.5 w-2.5" />
                      {m.pipedriveStage}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {(m.createdDate || m.date).slice(5)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
