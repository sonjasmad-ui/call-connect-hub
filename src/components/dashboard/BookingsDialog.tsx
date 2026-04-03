import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { dummyMeetings } from "@/data/dummyData";

interface BookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: { startDate: string; endDate: string };
}

const stageColors: Record<string, string> = {
  Lead: "bg-[hsl(var(--stat-blue))]/15 text-[hsl(var(--stat-blue))]",
  Discovery: "bg-[hsl(var(--stat-teal))]/15 text-[hsl(var(--stat-teal))]",
  Demo: "bg-[hsl(var(--stat-purple))]/15 text-[hsl(var(--stat-purple))]",
  Proposal: "bg-[hsl(var(--stat-orange))]/15 text-[hsl(var(--stat-orange))]",
  Negotiation: "bg-[hsl(var(--stat-green))]/15 text-[hsl(var(--stat-green))]",
};

export function BookingsDialog({ open, onOpenChange, dateRange }: BookingsDialogProps) {
  const bookings = dummyMeetings.filter(m => m.date >= dateRange.startDate && m.date <= dateRange.endDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bookings</DialogTitle>
        </DialogHeader>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No bookings in this date range</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {bookings.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.contactName} · {m.company}</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColors[m.pipedriveStage] || ""}`}>{m.pipedriveStage}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{m.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
