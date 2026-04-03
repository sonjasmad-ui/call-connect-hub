import { useState } from "react";
import { Target, Phone, Pencil, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BudgetTargetsProps {
  bookings: number;
  bookingTarget: number;
  daysLeft: number;
  totalCalls: number;
  callTarget: number;
  onBookingTargetChange?: (target: number) => void;
  onCallTargetChange?: (target: number) => void;
}

export function BudgetTargets({ bookings, bookingTarget, daysLeft, totalCalls, callTarget, onBookingTargetChange, onCallTargetChange }: BudgetTargetsProps) {
  const [editingBooking, setEditingBooking] = useState(false);
  const [editingCalls, setEditingCalls] = useState(false);
  const [bookingInput, setBookingInput] = useState(String(bookingTarget));
  const [callInput, setCallInput] = useState(String(callTarget));

  const bookingPct = Math.min(100, Math.round((bookings / bookingTarget) * 100));
  const callPct = Math.min(100, Math.round((totalCalls / callTarget) * 100));
  const bookingsNeeded = Math.max(0, bookingTarget - bookings);
  const perDay = daysLeft > 0 ? Math.ceil(bookingsNeeded / daysLeft) : 0;

  const saveBookingTarget = () => {
    const v = parseInt(bookingInput);
    if (v > 0) onBookingTargetChange?.(v);
    setEditingBooking(false);
  };
  const saveCallTarget = () => {
    const v = parseInt(callInput);
    if (v > 0) onCallTargetChange?.(v);
    setEditingCalls(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5 glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--stat-green))] to-[hsl(var(--stat-teal))] flex items-center justify-center">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Booking Target</p>
              <p className="text-xs text-muted-foreground">{daysLeft} days left this month</p>
            </div>
          </div>
          {editingBooking ? (
            <div className="flex items-center gap-1.5">
              <Input value={bookingInput} onChange={e => setBookingInput(e.target.value)} className="w-20 h-8 text-sm" />
              <Button size="sm" variant="ghost" onClick={saveBookingTarget}><Check className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { setBookingInput(String(bookingTarget)); setEditingBooking(true); }}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit target
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{bookings} / {bookingTarget} bookings</span>
            <span className="font-semibold text-foreground">{bookingPct}%</span>
          </div>
          <Progress value={bookingPct} className="h-2.5 bg-muted" />
          <p className="text-xs text-muted-foreground">Need {perDay} bookings/day to hit target</p>
        </div>
      </Card>

      <Card className="p-5 glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--stat-blue))] to-[hsl(var(--stat-purple))] flex items-center justify-center">
              <Phone className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Call Target</p>
              <p className="text-xs text-muted-foreground">Monthly call volume</p>
            </div>
          </div>
          {editingCalls ? (
            <div className="flex items-center gap-1.5">
              <Input value={callInput} onChange={e => setCallInput(e.target.value)} className="w-20 h-8 text-sm" />
              <Button size="sm" variant="ghost" onClick={saveCallTarget}><Check className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { setCallInput(String(callTarget)); setEditingCalls(true); }}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit target
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{totalCalls.toLocaleString()} / {callTarget.toLocaleString()} calls</span>
            <span className="font-semibold text-foreground">{callPct}%</span>
          </div>
          <Progress value={callPct} className="h-2.5 bg-muted" />
        </div>
      </Card>
    </div>
  );
}
