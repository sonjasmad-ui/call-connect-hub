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
  const [telavoxUsers, setTelavoxUsers] = useState<TelavoxUser[]>([]);
  const [pipedriveUsers, setPipedriveUsers] = useState<PipedriveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingLiveData, setUsingLiveData] = useState({ telavox: false, pipedrive: false });
  const [selectedTelavoxUser, setSelectedTelavoxUser] = useState<string>("all");
  const [selectedPipedriveUser, setSelectedPipedriveUser] = useState<string>("all");

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

    // Fetch calls
    if (hasTelavoxConfig()) {
      try {
        const liveCalls = await fetchTelavoxCalls(filters.startDate, filters.endDate);
        setCalls(liveCalls);
        live.telavox = true;
      } catch (err: any) {
        console.error("Telavox fetch failed, using dummy data:", err);
        toast.error("Telavox: " + (err.message || "Failed to fetch calls"));
        setCalls(dummyCalls);
      }
    } else {
      setCalls(dummyCalls);
    }

    // Fetch meetings
    if (hasPipedriveConfig()) {
      try {
        const pdUserId = selectedPipedriveUser !== "all" ? Number(selectedPipedriveUser) : undefined;
        const liveMeetings = await fetchPipedriveActivities(filters.startDate, filters.endDate, pdUserId);
        setMeetings(liveMeetings);
        live.pipedrive = true;
      } catch (err: any) {
        console.error("Pipedrive fetch failed, using dummy data:", err);
        toast.error("Pipedrive: " + (err.message || "Failed to fetch meetings"));
        setMeetings(dummyMeetings);
      }
    } else {
      setMeetings(dummyMeetings);
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

  // Apply client-side filters
  const filteredCalls = filterCalls(calls, filters).filter(c => {
    if (selectedTelavoxUser !== "all") {
      // For Telavox user filtering - if the call data has a user/extension field
      // This depends on the API response; for now we pass through
    }
    return true;
  });

  const overview = getOverviewStats(filteredCalls);
  const dailyData = getDailyData(filteredCalls);
  const hourlyData = getHourlyData(filteredCalls);

  // Count bookings created in the selected period
  const bookingsCount = meetings.filter(m => {
    const d = m.createdDate || m.date;
    return d >= filters.startDate && d <= filters.endDate;
  }).length;

  return {
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
    refresh: loadData,
  };
}
