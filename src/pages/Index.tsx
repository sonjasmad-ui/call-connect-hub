import { useState, useMemo, useEffect, useCallback } from "react";
import { loadAllMonthlyTargets, saveMonthlyTarget, monthKeyForRange } from "@/lib/monthlyTargets";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, Loader2, Wifi, WifiOff, Plus, Pencil, Check, LogOut, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsDialog } from "@/components/dashboard/SettingsDialog";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import { BookingsListDialog } from "@/components/dashboard/BookingsListDialog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { makeDefaultFilters, type DashboardFilters } from "@/data/dummyData";
import { useDashboards } from "@/dashboard/useDashboards";
import { DashboardSwitcher } from "@/dashboard/DashboardSwitcher";
import { DashboardGrid } from "@/dashboard/DashboardGrid";
import { WidgetLibrary } from "@/dashboard/WidgetLibrary";
import { WidgetSettings } from "@/dashboard/WidgetSettings";
import type { WidgetConfig } from "@/dashboard/types";

export default function Index() {
  const [filters, setFilters] = useState<DashboardFilters>(() => makeDefaultFilters());
  const [bookingTarget] = useState(30);
  const [callTarget] = useState(3000);
  const [editMode, setEditMode] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const navigate = useNavigate();

  const {
    filteredCalls, meetings, emails, linkedins, loading, usingLiveData,
    monthCalls, monthMeetings, monthStartDate, monthEndDate,
    telavoxMeta,
    telavoxUsers, pipedriveUsers,
    selectedTelavoxUser, selectedPipedriveUser,
    setSelectedTelavoxUser, setSelectedPipedriveUser,
    refresh,
  } = useDashboardData(filters);

  const {
    dashboards, active, activeId, defaultId, setActiveId,
    createDashboard, renameDashboard, duplicateDashboard, deleteDashboard, starDashboard,
    addWidget, updateWidget, removeWidget, setFeatured, setLayouts,
  } = useDashboards();

  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  useEffect(() => { loadAllMonthlyTargets().then(setMonthlyTargets).catch(() => {}); }, []);

  const targetMonth = useMemo(
    () => monthKeyForRange(filters.startDate, filters.endDate),
    [filters.startDate, filters.endDate],
  );

  /** When the filter is a single day, target widgets edit/read that day's blitz target. */
  const targetDay = useMemo(
    () => (filters.startDate && filters.startDate === filters.endDate ? filters.startDate : undefined),
    [filters.startDate, filters.endDate],
  );

  const onSaveMonthlyTarget = useCallback(
    (metric: "bookingTarget" | "callTarget", month: string, value: number) => {
      setMonthlyTargets(prev => ({ ...prev, [`${metric}:${month}`]: value }));
      saveMonthlyTarget(metric, month, value).catch(err => console.error("save target", err));
    },
    [],
  );

  const inputs = useMemo(() => ({
    calls: filteredCalls,
    meetings,
    emails,
    linkedins,
    monthCalls,
    monthMeetings,
    monthStartDate,
    monthEndDate,
    startDate: filters.startDate,
    endDate: filters.endDate,
    bookingTarget,
    callTarget,
    dateRange: filters.datePreset,
    monthlyTargets,
    targetMonth,
    targetDay,
    onSaveMonthlyTarget,
  }), [filteredCalls, meetings, emails, linkedins, monthCalls, monthMeetings, monthStartDate, monthEndDate, filters.startDate, filters.endDate, bookingTarget, callTarget, filters.datePreset, monthlyTargets, targetMonth, targetDay, onSaveMonthlyTarget]);


  const handleLock = () => {
    sessionStorage.removeItem("dashboard_access");
    navigate("/auth", { replace: true });
  };

  if (!active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg gradient-bar flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <DashboardSwitcher
                dashboards={dashboards}
                activeId={activeId}
                defaultId={defaultId}
                onSelect={setActiveId}
                onCreate={createDashboard}
                onRename={renameDashboard}
                onDuplicate={duplicateDashboard}
                onDelete={deleteDashboard}
                onStar={starDashboard}
              />
              <div className="hidden md:flex items-center gap-1.5">
                {usingLiveData.telavox ? (
                  <Badge variant="outline" className="text-[10px] gap-1 border-[hsl(var(--stat-green))]/30 text-[hsl(var(--stat-green))]">
                    <Wifi className="h-3 w-3" /> Telavox
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 border-muted text-muted-foreground">
                    <WifiOff className="h-3 w-3" /> Demo
                  </Badge>
                )}
                {usingLiveData.pipedrive && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-[hsl(var(--stat-green))]/30 text-[hsl(var(--stat-green))]">
                    <Wifi className="h-3 w-3" /> Pipedrive
                  </Badge>
                )}
                {usingLiveData.telavox && telavoxMeta?.mayBeIncomplete && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]"
                    title={telavoxMeta.limitation}
                  >
                    Limited call history
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {editMode && (
                <Button size="sm" onClick={() => setLibraryOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add widget
                </Button>
              )}
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(e => !e)}
                className="gap-1.5"
              >
                {editMode ? <><Check className="h-3.5 w-3.5" /> Done</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
              </Button>
              <SettingsDialog onSettingsSaved={refresh} />
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLock} className="gap-1.5 text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" />
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

          <DashboardGrid
            dashboard={active}
            inputs={inputs}
            editMode={editMode}
            onLayoutsChange={setLayouts}
            onEditWidget={setEditingWidget}
            onRemoveWidget={removeWidget}
            onUpdateWidget={updateWidget}
            onOpenBookings={() => setBookingsOpen(true)}
          />
        </div>
      </main>

      <WidgetLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onAdd={addWidget}
      />

      <WidgetSettings
        widget={editingWidget}
        onClose={() => setEditingWidget(null)}
        onSave={updateWidget}
        onDelete={removeWidget}
        onSetFeatured={setFeatured}
      />

      <BookingsListDialog
        open={bookingsOpen}
        onClose={() => setBookingsOpen(false)}
        meetings={meetings}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />
    </div>
  );
}
