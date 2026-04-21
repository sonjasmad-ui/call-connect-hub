import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Building2, User, Clock, Calendar, FileText, Volume2 } from "lucide-react";
import type { CallRecord } from "@/data/dummyData";

interface CallDetailDialogProps {
  call: CallRecord | null;
  onClose: () => void;
}

const statusVariant = (s: CallRecord["status"]) =>
  s === "answered" ? "default" : s === "missed" ? "destructive" : "secondary";

const fmtDur = (s: number) => {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, "0")}s`;
};

export function CallDetailDialog({ call, onClose }: CallDetailDialogProps) {
  return (
    <Dialog open={!!call} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {call && (
          <>
            <div className="px-6 pt-6 pb-4 gradient-bar text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  {call.status === "missed" ? (
                    <PhoneMissed className="h-5 w-5" />
                  ) : call.direction === "inbound" ? (
                    <PhoneIncoming className="h-5 w-5" />
                  ) : (
                    <PhoneOutgoing className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-primary-foreground truncate">
                      {call.contactName || "Unknown contact"}
                    </DialogTitle>
                  </DialogHeader>
                  {call.company && (
                    <p className="text-xs text-primary-foreground/85 truncate">{call.company}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
                  <span className="font-mono text-xs">{call.phone}</span>
                </DetailRow>
                <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Duration">
                  {fmtDur(call.duration)}
                </DetailRow>
                <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="When">
                  {call.date} · {call.time}
                </DetailRow>
                <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Direction">
                  <span className="capitalize">{call.direction}</span>
                </DetailRow>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusVariant(call.status)} className="capitalize">
                  {call.status}
                </Badge>
                {call.userName && (
                  <Badge variant="outline" className="gap-1">
                    <User className="h-3 w-3" /> {call.userName}
                  </Badge>
                )}
                {call.company && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" /> {call.company}
                  </Badge>
                )}
              </div>

              {call.notes && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Notes
                  </p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">{call.notes}</p>
                </div>
              )}

              {call.recordingUrl && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Volume2 className="h-3 w-3" /> Recording
                  </p>
                  <audio controls preload="none" className="w-full h-9">
                    <source src={call.recordingUrl} />
                  </audio>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm text-foreground mt-0.5 truncate">{children}</p>
    </div>
  );
}
