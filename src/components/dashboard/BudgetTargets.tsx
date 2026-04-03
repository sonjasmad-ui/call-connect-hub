import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BudgetTargetsProps {
  bookings: number;
  bookingTarget: number;
  daysLeft: number;
  totalCalls: number;
  callTarget: number;
  costPerBooking: number;
  monthlyBudget: number;
}

export function BudgetTargets({
  bookings,
  bookingTarget,
  daysLeft,
  totalCalls,
  callTarget,
  costPerBooking,
  monthlyBudget,
}: BudgetTargetsProps) {
  const remaining = bookingTarget - bookings;
  const requiredPerDay = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0;
  const projectedBookings = daysLeft > 0 ? Math.round(bookings + (bookings / (30 - daysLeft)) * daysLeft) : bookings;
  const callsRemaining = callTarget - totalCalls;
  const callsPerDay = daysLeft > 0 ? Math.ceil(callsRemaining / daysLeft) : 0;
  const expectedRevenue = bookings * 4546 + Math.round(Math.random() * 1000);
  const roi = monthlyBudget > 0 ? (expectedRevenue / monthlyBudget).toFixed(1) : "0";

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">BUDGET & TARGETS</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="font-semibold text-foreground">Monthly booking target</p>
            <span className="text-sm text-muted-foreground">{daysLeft} days left</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{bookings} / {bookingTarget}</p>
          <p className="text-sm text-muted-foreground mb-3">{remaining} remaining this month</p>
          <Progress value={(bookings / bookingTarget) * 100} className="h-2 mb-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required per day</span>
              <span className="font-semibold text-foreground">{requiredPerDay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projected bookings</span>
              <span className="font-semibold text-foreground">{projectedBookings}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="font-semibold text-foreground">Call budget</p>
            <span className="text-sm text-muted-foreground">Monthly target</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-foreground">Calls made this month</p>
                <p className="text-muted-foreground">{callTarget.toLocaleString()} monthly target</p>
              </div>
              <span className="text-xl font-bold text-foreground">{totalCalls.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-foreground">Calls remaining</p>
                <p className="text-muted-foreground">Until monthly target</p>
              </div>
              <span className="text-xl font-bold text-foreground">{callsRemaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-foreground">Required per day</p>
                <p className="text-muted-foreground">To hit call target</p>
              </div>
              <span className="text-xl font-bold text-foreground">{callsPerDay}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="font-semibold text-foreground">Economics</p>
            <span className="text-sm text-muted-foreground">Budget layer</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-foreground">Expected revenue</p>
                <p className="text-muted-foreground">Based on booked meetings</p>
              </div>
              <span className="text-xl font-bold text-foreground">DKK {expectedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-foreground">Cost per booking</p>
                <p className="text-muted-foreground">Using monthly cost budget</p>
              </div>
              <span className="text-xl font-bold text-foreground">DKK {costPerBooking.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-foreground">Estimated ROI</p>
                <p className="text-muted-foreground">Expected revenue ÷ cost budget</p>
              </div>
              <span className="text-xl font-bold text-foreground">{roi}x</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
