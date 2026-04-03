import { useState } from "react";
import { Play, Phone, PhoneOff, PhoneMissed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CallRecord } from "@/data/dummyData";

interface CallRecordingsTableProps {
  calls: CallRecord[];
}

const statusConfig = {
  answered: { icon: Phone, variant: "default" as const, label: "Answered" },
  missed: { icon: PhoneMissed, variant: "destructive" as const, label: "Missed" },
  busy: { icon: PhoneOff, variant: "secondary" as const, label: "Busy" },
  voicemail: { icon: Phone, variant: "outline" as const, label: "Voicemail" },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CallRecordingsTable({ calls }: CallRecordingsTableProps) {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const recentCalls = calls.slice(-50).reverse();

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">RECENT CALLS</p>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Duration</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Direction</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Recording</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map(call => {
                const cfg = statusConfig[call.status];
                return (
                  <tr
                    key={call.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCall(call)}
                  >
                    <td className="p-3 text-foreground">{call.date}</td>
                    <td className="p-3 text-foreground">{call.time}</td>
                    <td className="p-3 text-foreground font-medium">{call.contactName}</td>
                    <td className="p-3 text-muted-foreground">{call.company}</td>
                    <td className="p-3"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                    <td className="p-3 text-foreground">{formatDuration(call.duration)}</td>
                    <td className="p-3 text-muted-foreground capitalize">{call.direction}</td>
                    <td className="p-3">
                      {call.recordingUrl && (
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedCall(call); }}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Contact</p><p className="font-medium text-foreground">{selectedCall.contactName}</p></div>
                <div><p className="text-muted-foreground">Company</p><p className="font-medium text-foreground">{selectedCall.company}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-foreground">{selectedCall.phone}</p></div>
                <div><p className="text-muted-foreground">Duration</p><p className="font-medium text-foreground">{formatDuration(selectedCall.duration)}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant={statusConfig[selectedCall.status].variant}>{statusConfig[selectedCall.status].label}</Badge></div>
                <div><p className="text-muted-foreground">Direction</p><p className="font-medium text-foreground capitalize">{selectedCall.direction}</p></div>
              </div>
              {selectedCall.recordingUrl && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-2">Recording</p>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <Play className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Recording playback will be available when connected to Telavox</p>
                  </div>
                </div>
              )}
              {selectedCall.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-1">Notes</p>
                  <p className="text-foreground">{selectedCall.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
