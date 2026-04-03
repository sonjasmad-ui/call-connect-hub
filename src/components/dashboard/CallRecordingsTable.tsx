import { useState } from "react";
import { Search, Play, ChevronDown, ChevronUp, PhoneIncoming, PhoneOutgoing, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import type { CallRecord } from "@/data/dummyData";

interface CallRecordingsTableProps {
  calls: CallRecord[];
}

export function CallRecordingsTable({ calls }: CallRecordingsTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"date" | "duration">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = calls
    .filter(c => c.phone.includes(search) || c.notes?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "date") return mul * (`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
      return mul * (a.duration - b.duration);
    });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (field: "date" | "duration") => {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: "date" | "duration" }) =>
    sortField === field ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null;

  const statusVariant = (s: string) => {
    switch (s) {
      case "answered": return "default";
      case "missed": return "destructive";
      default: return "secondary";
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Recent Calls</p>
            <p className="text-xs text-muted-foreground">{filtered.length} calls · Page {page + 1} of {totalPages}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone or notes..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 text-sm bg-background"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("date")}>
                <span className="flex items-center gap-1">Date / Time <SortIcon field="date" /></span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Direction</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("duration")}>
                <span className="flex items-center gap-1">Duration <SortIcon field="duration" /></span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recording</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(call => (
              <tr key={call.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedCall(call)}>
                <td className="px-4 py-3 whitespace-nowrap text-foreground">{call.date} {call.time}</td>
                <td className="px-4 py-3">
                  {call.direction === "outbound"
                    ? <span className="flex items-center gap-1 text-[hsl(var(--stat-blue))]"><PhoneOutgoing className="h-3.5 w-3.5" /> Out</span>
                    : <span className="flex items-center gap-1 text-[hsl(var(--stat-green))]"><PhoneIncoming className="h-3.5 w-3.5" /> In</span>
                  }
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{call.phone}</td>
                <td className="px-4 py-3"><Badge variant={statusVariant(call.status)} className="text-xs capitalize">{call.status}</Badge></td>
                <td className="px-4 py-3 text-foreground">{formatDuration(call.duration)}</td>
                <td className="px-4 py-3">
                  {call.recordingUrl && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" onClick={e => e.stopPropagation()}>
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = page < 3 ? i : page - 2 + i;
            if (p >= totalPages) return null;
            return (
              <Button key={p} variant={p === page ? "default" : "ghost"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p)}>
                {p + 1}
              </Button>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date</span><p className="font-medium text-foreground">{selectedCall.date} {selectedCall.time}</p></div>
                <div><span className="text-muted-foreground">Direction</span><p className="font-medium text-foreground capitalize">{selectedCall.direction}</p></div>
                <div><span className="text-muted-foreground">Phone</span><p className="font-medium text-foreground font-mono">{selectedCall.phone}</p></div>
                <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusVariant(selectedCall.status)} className="capitalize">{selectedCall.status}</Badge></p></div>
                <div><span className="text-muted-foreground">Duration</span><p className="font-medium text-foreground">{formatDuration(selectedCall.duration)}</p></div>
              </div>
              {selectedCall.notes && (
                <div className="text-sm p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="text-foreground mt-1">{selectedCall.notes}</p>
                </div>
              )}
              {selectedCall.recordingUrl && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Recording will play from Telavox when connected</p>
                  <Button size="sm" variant="outline"><Play className="h-4 w-4 mr-1" /> Play recording</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
