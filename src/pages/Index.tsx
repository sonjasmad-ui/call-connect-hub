import { useState, useCallback } from "react";
import { RefreshCw, Save, Loader2, Wifi, WifiOff } from "lucide-react";
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
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  defaultFilters,
  defaultSavedViews,
  type DashboardFilters,
  type SavedView,
} from "@/data/dummyData";
import { Badge } from "@/components/ui/badge";

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

  const {
    filteredCalls,
    meetings,
    overview,
    dailyData,
    hourlyData,
    bookingsCount,
    loading,
    usingLiveData,
    telavoxUsers,
    pipedriveUsers,
    selectedTelavoxUser,
    selectedPipedriveUser,
    setSelectedTelavoxUser,
    setSelectedPipedriveUser,
    refresh,
  } = useDashboardData(filters);

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
    overview: <OverviewCards {...overview} bookings={bookingsCount} onBookingsClick={() => setShowBookings(true)} />,
    targets: (
      <BudgetTargets
        bookings={bookingsCount}
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
              <div className="flex items-center gap-1.5">
                {usingLiveData.telavox ? (
                  <Badge variant="outline" className="text-[10px] gap-1 border-[hsl(var(--stat-green))]/30 text-[hsl(var(--stat-green))]">
                    <Wifi className="h-3 w-3" /> Telavox
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 border-muted text-muted-foreground">
                    <WifiOff className="h-3 w-3" /> Demo
                  </Badge>
                )}
                {usingLiveData.pipedrive ? (
                  <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">
                    <Wifi className="h-3 w-3" /> Pipedrive
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <SettingsDialog onSettingsSaved={refresh} />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={refresh} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
              </Button>
            </div>
          </div>

          <MotivationalQuote />

          <FilterBar
            filters={filters}
            onChange={setFilters}
            telavoxUsers={telavoxUsers}
            pipedriveUsers={pipedriveUsers}
            selectedTelavoxUser={selectedTelavoxUser}
            selectedPipedriveUser={selectedPipedriveUser}
            onTelavoxUserChange={setSelectedTelavoxUser}
            onPipedriveUserChange={setSelectedPipedriveUser}
          />

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
        meetings={meetings}
        dateRange={{ startDate: filters.startDate, endDate: filters.endDate }}
      />
    </div>
  );
}
