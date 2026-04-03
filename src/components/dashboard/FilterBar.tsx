import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DashboardFilters, getDateRange } from "@/data/dummyData";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const datePresets = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last14", label: "Last 14 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "custom", label: "Custom range" },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(filters.startDate));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(filters.endDate));

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      onChange({ ...filters, datePreset: "custom" });
    } else {
      const range = getDateRange(preset);
      onChange({ ...filters, datePreset: preset, ...range });
    }
  };

  const handleCustomStart = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      onChange({ ...filters, datePreset: "custom", startDate: date.toISOString().slice(0, 10) });
    }
  };

  const handleCustomEnd = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      onChange({ ...filters, datePreset: "custom", endDate: date.toISOString().slice(0, 10) });
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 flex flex-wrap items-end gap-3">
      <div className="min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date range</label>
        <Select value={filters.datePreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="text-sm bg-background">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {datePresets.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.datePreset === "custom" && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal text-sm", !startDate && "text-muted-foreground")}>
                  {startDate ? format(startDate, "dd MMM yyyy") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={handleCustomStart} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal text-sm", !endDate && "text-muted-foreground")}>
                  {endDate ? format(endDate, "dd MMM yyyy") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={handleCustomEnd} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      <div className="min-w-[140px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Direction</label>
        <Select value={filters.direction} onValueChange={v => onChange({ ...filters, direction: v })}>
          <SelectTrigger className="text-sm bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All calls</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[140px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
        <Select value={filters.status} onValueChange={v => onChange({ ...filters, status: v })}>
          <SelectTrigger className="text-sm bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
