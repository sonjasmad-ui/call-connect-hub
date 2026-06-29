import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  hasTelavoxConfig,
  hasPipedriveConfig,
  fetchTelavoxCalls,
  fetchTelavoxUsers,
  fetchPipedriveActivities,
  fetchPipedriveUsers,
} from "@/lib/api";
import {
  dummyCalls,
  dummyMeetings,
  fmtLocalDate,
  filterCalls,
  getOverviewStats,
  getDailyData,
  getHourlyData,
  type CallRecord,
  type Meeting,
  type DashboardFilters,
} from "@/data/dummyData";

interface TelavoxUser {
  id: string;
  name: string;
  email: string;
  extension: string;
}

interface PipedriveUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export function useDashboardData(filters: DashboardFilters) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [emails, setEmails] = useState<Meeting[]>([]);
  const [linkedins, setLinkedins] = useState<Meeting[]>([]);
  const [monthCalls, setMonthCalls] = useState<CallRecord[]>([]);
  const [monthMeetings, setMonthMeetings] = useState<Meeting[]>([]);
  const [telavoxMeta, setTelavoxMeta] = useState<{ mayBeIncomplete?: boolean; limitation?: string } | null>(null);
  const [telavoxUsers, setTelavoxUsers] = useState<TelavoxUser[]>([]);
  const [pipedriveUsers, setPipedriveUsers] = useState<PipedriveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingLiveData, setUsingLiveData] = useState({ telavox: false, pipedrive: false });
  const [selectedTelavoxUser, setSelectedTelavoxUser] = useState<string>("all");
  const [selectedPipedriveUser, setSelectedPipedriveUser] = useState<string>("all");

  const monthRange = (() => {
    const t = new Date();
    return {
      start: fmtLocalDate(new Date(t.getFullYear(), t.getMonth(), 1)),
      end: fmtLocalDate(t),
    };
  })();

  const loadUsers = useCallback(async () => {
    if (hasTelavoxConfig()) {
      try {
        const users = await fetchTelavoxUsers();
        setTelavoxUsers(users);
      } catch (err) {
        console.warn("Failed to load Telavox users:", err);
      }
    }
    if (hasPipedriveConfig()) {
      try {
        const users = await fetchPipedriveUsers();
        setPipedriveUsers(users.filter(u => u.active));
      } catch (err) {
        console.warn("Failed to load Pipedrive users:", err);
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const live = { telavox: false, pipedrive: false };

    if (hasTelavoxConfig()) {
      try {
        const telavox = await fetchTelavoxCalls(filters.startDate, filters.endDate);
        setCalls(telavox.calls);
        setTelavoxMeta(telavox.meta || null);
        live.telavox = true;
      } catch (err: any) {
        console.error("Telavox fetch failed, using dummy data:", err);
        toast.error("Telavox: " + (err.message || "Failed to fetch calls"));
        setCalls(dummyCalls);
        setTelavoxMeta(null);
      }
    } else {
      setCalls(dummyCalls);
      setTelavoxMeta(null);
    }

    if (hasPipedriveConfig()) {
      const pdUserId = selectedPipedriveUser !== "all" ? Number(selectedPipedriveUser) : undefined;
      try {
        const liveMeetings = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId, "meeting");
        setMeetings(liveMeetings);
        live.pipedrive = true;
      } catch (err: any) {
        console.error("Pipedrive meetings fetch failed:", err);
        toast.error("Pipedrive: " + (err.message || "Failed to fetch meetings"));
        setMeetings(dummyMeetings);
      }
      // Emails (best-effort, silent on error)
      try {
        const liveEmails = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId, "email");
        setEmails(liveEmails);
      } catch (err) {
        console.warn("Pipedrive emails fetch failed:", err);
        setEmails([]);
      }
      // LinkedIn (custom activity type — silent if not configured)
      try {
        const liveLinkedins = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId, "linkedin");
        setLinkedins(liveLinkedins);
      } catch (err) {
        console.warn("Pipedrive linkedin fetch failed:", err);
        setLinkedins([]);
      }
    } else {
      setMeetings(dummyMeetings);
      setEmails([]);
      setLinkedins([]);
    }

    // Month-to-date — used by target widgets so they always reflect the current month
    // regardless of the dashboard's date-range filter.
    const sameAsFilter = filters.startDate === monthRange.start && filters.endDate === monthRange.end;
    if (sameAsFilter) {
      // Reuse the data we just fetched.
      // (set after state below to avoid race; safe to just call setters again)
    }
    try {
      if (hasTelavoxConfig() && !sameAsFilter) {
        const t = await fetchTelavoxCalls(monthRange.start, monthRange.end);
        setMonthCalls(t.calls);
      }
    } catch (e) { console.warn("month calls fetch failed", e); }
    try {
      if (hasPipedriveConfig() && !sameAsFilter) {
        const pdUserId = selectedPipedriveUser !== "all" ? Number(selectedPipedriveUser) : undefined;
        const m = await fetchPipedriveActivities(monthRange.start, monthRange.end, pdUserId, "meeting");
        setMonthMeetings(m);
      }
    } catch (e) { console.warn("month meetings fetch failed", e); }

    setUsingLiveData(live);
    setLoading(false);
  }, [filters.startDate, filters.endDate, selectedPipedriveUser, monthRange.start, monthRange.end]);

  // When the active range IS the current month, mirror it into month state.
  useEffect(() => {
    if (filters.startDate === monthRange.start && filters.endDate === monthRange.end) {
      setMonthCalls(calls);
      setMonthMeetings(meetings);
    }
  }, [calls, meetings, filters.startDate, filters.endDate, monthRange.start, monthRange.end]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const lastLoadRef = useRef<number>(0);
  useEffect(() => {
    loadData();
    lastLoadRef.current = Date.now();
  }, [loadData]);

  // Refresh only when the tab regains focus AND data is older than 15 minutes.
  // No periodic interval — Pipedrive's daily token budget is shared company-wide.
  useEffect(() => {
    const STALE_MS = 15 * 60_000;
    const maybeReload = () => {
      if (Date.now() - lastLoadRef.current > STALE_MS) {
        loadData();
        lastLoadRef.current = Date.now();
      }
    };
    const onFocus = () => maybeReload();
    const onVisibility = () => { if (document.visibilityState === "visible") maybeReload(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadData]);

  const filteredCalls = filterCalls(calls, filters).filter(c => {
    if (selectedTelavoxUser !== "all") {
      // pass-through
    }
    return true;
  });

  const overview = getOverviewStats(filteredCalls);
  const dailyData = getDailyData(filteredCalls);
  const hourlyData = getHourlyData(filteredCalls);

  const bookingsCount = meetings.filter(m => {
    const d = m.createdDate || m.date;
    return d >= filters.startDate && d <= filters.endDate;
  }).length;

  return {
    filteredCalls,
    meetings,
    emails,
    linkedins,
    monthCalls,
    monthMeetings,
    monthStartDate: monthRange.start,
    monthEndDate: monthRange.end,
    overview,
    dailyData,
    hourlyData,
    bookingsCount,
    loading,
    usingLiveData,
    telavoxMeta,
    telavoxUsers,
    pipedriveUsers,
    selectedTelavoxUser,
    selectedPipedriveUser,
    setSelectedTelavoxUser,
    setSelectedPipedriveUser,
    refresh: loadData,
  };
}
