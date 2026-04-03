import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardFilters } from "@/data/dummyData";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const update = (key: keyof DashboardFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
        <Input type="date" value={filters.startDate} onChange={e => update("startDate", e.target.value)} className="text-sm" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">End date</label>
        <Input type="date" value={filters.endDate} onChange={e => update("endDate", e.target.value)} className="text-sm" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">User</label>
        <Select value={filters.user} onValueChange={v => update("user", v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Source</label>
        <Select value={filters.source} onValueChange={v => update("source", v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Telavox + Pipedrive</SelectItem>
            <SelectItem value="telavox">Telavox</SelectItem>
            <SelectItem value="pipedrive">Pipedrive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Direction</label>
        <Select value={filters.direction} onValueChange={v => update("direction", v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All calls</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
        <Select value={filters.status} onValueChange={v => update("status", v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
