const API_BASE = "http://localhost:3001/api";

export interface ApiHealth {
  status: string;
  integrations: {
    telavox: "connected" | "not configured";
    pipedrive: "connected" | "not configured";
  };
}

export async function checkHealth(): Promise<ApiHealth | null> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCalls(from: string, to: string) {
  const res = await fetch(`${API_BASE}/telavox/calls?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("Failed to fetch calls");
  const data = await res.json();
  return data.calls;
}

export async function fetchMeetings(start: string, end: string) {
  const res = await fetch(`${API_BASE}/pipedrive/activities?type=meeting&start=${start}&end=${end}`);
  if (!res.ok) throw new Error("Failed to fetch meetings");
  const data = await res.json();
  return data.meetings;
}

export async function searchContact(phone: string) {
  const res = await fetch(`${API_BASE}/pipedrive/person/search?phone=${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error("Failed to search contact");
  return res.json();
}

export async function fetchDeals() {
  const res = await fetch(`${API_BASE}/pipedrive/deals`);
  if (!res.ok) throw new Error("Failed to fetch deals");
  const data = await res.json();
  return data.deals;
}

export function getRecordingUrl(recordingId: string) {
  return `${API_BASE}/telavox/recording/${recordingId}`;
}
