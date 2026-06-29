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

  // ── Telavox calls only (cheap, safe to auto-refresh) ──
  const loadCalls = useCallback(async () => {
    if (!hasTelavoxConfig()) {
      setCalls(dummyCalls);
      setTelavoxMeta(null);
      return;
    }
    try {
      const telavox = await fetchTelavoxCalls(filters.startDate, filters.endDate);
      setCalls(telavox.calls);
      setTelavoxMeta(telavox.meta || null);
      setUsingLiveData(prev => ({ ...prev, telavox: true }));
    } catch (err: any) {
      console.error("Telavox fetch failed, using dummy data:", err);
      toast.error("Telavox: " + (err.message || "Failed to fetch calls"));
      setCalls(dummyCalls);
      setTelavoxMeta(null);
    }
    // Month-to-date telavox (for target widgets) — only when the active range differs
    const sameAsFilter = filters.startDate === monthRange.start && filters.endDate === monthRange.end;
    if (!sameAsFilter) {
      try {
        const t = await fetchTelavoxCalls(monthRange.start, monthRange.end);
        setMonthCalls(t.calls);
      } catch (e) { console.warn("month calls fetch failed", e); }
    }
  }, [filters.startDate, filters.endDate, monthRange.start, monthRange.end]);

  // ── Pipedrive (token-budget sensitive — manual refresh only) ──
  const loadPipedrive = useCallback(async () => {
    if (!hasPipedriveConfig()) {
      setMeetings(dummyMeetings);
      setEmails([]);
      setLinkedins([]);
      return;
    }
    const pdUserId = selectedPipedriveUser !== "all" ? Number(selectedPipedriveUser) : undefined;
    try {
      const liveMeetings = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId, "meeting");
      setMeetings(liveMeetings);
      setUsingLiveData(prev => ({ ...prev, pipedrive: true }));
    } catch (err: any) {
      console.error("Pipedrive meetings fetch failed:", err);
      toast.error("Pipedrive: " + (err.message || "Failed to fetch meetings"));
      setMeetings(dummyMeetings);
    }
    try {
      const liveEmails = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId, "email");
      setEmails(liveEmails);
    } catch (err) { console.warn("Pipedrive emails fetch failed:", err); setEmails([]); }
    try {
      const liveLinkedins = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId, "linkedin");
      setLinkedins(liveLinkedins);
    } catch (err) { console.warn("Pipedrive linkedin fetch failed:", err); setLinkedins([]); }

    const sameAsFilter = filters.startDate === monthRange.start && filters.endDate === monthRange.end;
    if (!sameAsFilter) {
      try {
        const m = await fetchPipedriveActivities(monthRange.start, monthRange.end, pdUserId, "meeting");
        setMonthMeetings(m);
      } catch (e) { console.warn("month meetings fetch failed", e); }
    }
  }, [filters.startDate, filters.endDate, selectedPipedriveUser, monthRange.start, monthRange.end]);

  // Manual refresh = both
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCalls(), loadPipedrive()]);
    setLoading(false);
  }, [loadCalls, loadPipedrive]);

  // When the active range IS the current month, mirror it into month state.
  useEffect(() => {
    if (filters.startDate === monthRange.start && filters.endDate === monthRange.end) {
      setMonthCalls(calls);
      setMonthMeetings(meetings);
    }
  }, [calls, meetings, filters.startDate, filters.endDate, monthRange.start, monthRange.end]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Initial load: both. Subsequent filter changes: both (one-shot per change).
  const lastCallsRef = useRef<number>(0);
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadCalls(), loadPipedrive()]);
      setLoading(false);
      lastCallsRef.current = Date.now();
    })();
  }, [loadCalls, loadPipedrive]);

  // Auto-refresh: ONLY Telavox calls. Pipedrive stays put until the user pulls refresh.
  useEffect(() => {
    const CALLS_INTERVAL = 60_000; // 1 min — Telavox calls live-update
    const interval = setInterval(() => {
      loadCalls();
      lastCallsRef.current = Date.now();
    }, CALLS_INTERVAL);
    const onFocus = () => {
      if (Date.now() - lastCallsRef.current > 30_000) {
        loadCalls();
        lastCallsRef.current = Date.now();
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") onFocus(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadCalls]);

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
