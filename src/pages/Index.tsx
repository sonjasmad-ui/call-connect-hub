import { useState, useMemo, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewSidebar } from "@/components/dashboard/ViewSidebar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { BudgetTargets } from "@/components/dashboard/BudgetTargets";
import { TrendsCharts } from "@/components/dashboard/TrendsCharts";
import { CallRecordingsTable } from "@/components/dashboard/CallRecordingsTable";
import {
  dummyCalls,
  defaultFilters,
  defaultSavedViews,
  filterCalls,
  getOverviewStats,
  getDailyData,
  getHourlyData,
  type DashboardFilters,
  type SavedView,
} from "@/data/dummyData";

export default function Index() {
  const [views, setViews] = useState<SavedView[]>(defaultSavedViews);
  const [activeViewId, setActiveViewId] = useState("v1");
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [lastUpdated] = useState(new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));

  const filteredCalls = useMemo(() => filterCalls(dummyCalls, filters), [filters]);
  const overview = useMemo(() => getOverviewStats(filteredCalls), [filteredCalls]);
  const dailyData = useMemo(() => getDailyData(filteredCalls), [filteredCalls]);
  const hourlyData = useMemo(() => getHourlyData(filteredCalls), [filteredCalls]);
  const bookings = 15;

  const handleSelectView = useCallback((view: SavedView) => {
    setActiveViewId(view.id);
    setFilters(view.filters);
  }, []);

  const handleSaveView = useCallback((name: string, f: DashboardFilters) => {
    const newView: SavedView = { id: `v${Date.now()}`, name, filters: { ...f } };
    setViews(prev => [...prev, newView]);
    setActiveViewId(newView.id);
  }, []);

  const handleDeleteView = useCallback((id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
    setActiveViewId("v1");
    setFilters(defaultFilters);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <ViewSidebar
        views={views}
        activeViewId={activeViewId}
        onSelectView={handleSelectView}
        onSaveView={handleSaveView}
        onDeleteView={handleDeleteView}
        currentFilters={filters}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Adversus-style workspace for Telavox + Pipedrive performance, goals, and recordings.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1">Updated {lastUpdated}</span>
              <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
              <Button size="sm">Save view</Button>
            </div>
          </div>

          {/* Demo banner */}
          <div className="bg-stat-green/10 border border-stat-green/30 rounded-lg px-4 py-2">
            <p className="text-sm font-medium" style={{ color: "hsl(var(--stat-green))" }}>
              Viewing Offline Demo Mode. Dummy data active.
            </p>
          </div>

          <FilterBar filters={filters} onChange={setFilters} />
          <OverviewCards {...overview} />
          <BudgetTargets
            bookings={bookings}
            bookingTarget={30}
            daysLeft={12}
            totalCalls={overview.totalCalls}
            callTarget={3000}
            costPerBooking={3200}
            monthlyBudget={25000}
          />
          <TrendsCharts dailyData={dailyData} hourlyData={hourlyData} />
          <CallRecordingsTable calls={filteredCalls} />
        </div>
      </main>
    </div>
  );
}
