import { useState, useMemo, useCallback } from "react";
import { RefreshCw, Save } from "lucide-react";
import { SettingsDialog } from "@/components/dashboard/SettingsDialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arraySwap } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ViewSidebar } from "@/components/dashboard/ViewSidebar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { BudgetTargets } from "@/components/dashboard/BudgetTargets";
import { TrendsCharts } from "@/components/dashboard/TrendsCharts";
import { CallRecordingsTable } from "@/components/dashboard/CallRecordingsTable";
import { DraggableWidget } from "@/components/dashboard/DraggableWidget";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import { BookingsDialog } from "@/components/dashboard/BookingsDialog";
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

const defaultWidgetOrder = ["overview", "targets", "trends", "calls"];

export default function Index() {
  const [views, setViews] = useState<SavedView[]>(defaultSavedViews);
  const [activeViewId, setActiveViewId] = useState("v1");
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [bookingTarget, setBookingTarget] = useState(30);
  const [callTarget, setCallTarget] = useState(3000);
  const [widgetOrder, setWidgetOrder] = useState(defaultWidgetOrder);
  const [showBookings, setShowBookings] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [lastUpdated] = useState(new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));

  const filteredCalls = useMemo(() => filterCalls(dummyCalls, filters), [filters]);
  const overview = useMemo(() => getOverviewStats(filteredCalls), [filteredCalls]);
  const dailyData = useMemo(() => getDailyData(filteredCalls), [filteredCalls]);
  const hourlyData = useMemo(() => getHourlyData(filteredCalls), [filteredCalls]);
  const bookings = 15;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder(prev => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        return arraySwap(prev, oldIdx, newIdx);
      });
    }
  }, []);

  const handleSelectView = useCallback((view: SavedView) => {
    setActiveViewId(view.id);
    setFilters(view.filters);
  }, []);

  const handleSaveView = useCallback((name: string) => {
    if (!name.trim()) return;
    const newView: SavedView = { id: `v${Date.now()}`, name: name.trim(), filters: { ...filters } };
    setViews(prev => [...prev, newView]);
    setActiveViewId(newView.id);
    setSaveName("");
    setSaveOpen(false);
  }, [filters]);

  const handleDeleteView = useCallback((id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
    setActiveViewId("v1");
    setFilters(defaultFilters);
  }, []);

  const widgetMap: Record<string, React.ReactNode> = {
    overview: <OverviewCards {...overview} bookings={bookings} onBookingsClick={() => setShowBookings(true)} />,
    targets: (
      <BudgetTargets
        bookings={bookings}
        bookingTarget={bookingTarget}
        daysLeft={12}
        totalCalls={overview.totalCalls}
        callTarget={callTarget}
        onBookingTargetChange={setBookingTarget}
        onCallTargetChange={setCallTarget}
      />
    ),
    trends: <TrendsCharts dailyData={dailyData} hourlyData={hourlyData} />,
    calls: <CallRecordingsTable calls={filteredCalls} />,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <ViewSidebar
        views={views}
        activeViewId={activeViewId}
        onSelectView={handleSelectView}
        onDeleteView={handleDeleteView}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1.5">Updated {lastUpdated}</span>
              <Popover open={saveOpen} onOpenChange={setSaveOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save View</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <p className="text-sm font-medium text-foreground mb-2">Save current filters as a view</p>
                  <Input
                    placeholder="View name..."
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSaveView(saveName)}
                    autoFocus
                    className="text-sm mb-2"
                  />
                  <Button size="sm" className="w-full" onClick={() => handleSaveView(saveName)} disabled={!saveName.trim()}>Save</Button>
                </PopoverContent>
              </Popover>
              <SettingsDialog />
              <Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            </div>
          </div>

          <MotivationalQuote />

          <FilterBar filters={filters} onChange={setFilters} />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-5">
                {widgetOrder.map(id => (
                  <DraggableWidget key={id} id={id}>
                    {widgetMap[id]}
                  </DraggableWidget>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </main>

      <BookingsDialog
        open={showBookings}
        onOpenChange={setShowBookings}
        dateRange={{ startDate: filters.startDate, endDate: filters.endDate }}
      />
    </div>
  );
}
