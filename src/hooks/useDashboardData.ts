import { useState, useEffect, useCallback } from "react";
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
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return {
      start: fmt(new Date(t.getFullYear(), t.getMonth(), 1)),
      end: fmt(t),
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

    setUsingLiveData(live);
    setLoading(false);
  }, [filters.startDate, filters.endDate, selectedPipedriveUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadData();
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
