import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function normalizeBase(input?: string): string {
  let b = (input || "").trim();
  if (!b) return "https://api.telavox.se";
  b = b.replace(/\/+$/, "");
  // Strip any trailing /v1 — Telavox public endpoints are at root (e.g. /calls)
  b = b.replace(/\/v\d+$/, "");
  return b;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { apiKey: bodyKey, baseUrl, fromDate, toDate } = await req.json();
    const apiKey = (bodyKey && String(bodyKey).trim()) || Deno.env.get("TELAVOX_API_KEY") || "";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Telavox API key not configured (set TELAVOX_API_KEY backend secret)" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = normalizeBase(baseUrl);
    const url = new URL(`${base}/calls`);
    if (fromDate) url.searchParams.set("fromDate", fromDate);
    if (toDate) url.searchParams.set("toDate", toDate);
    url.searchParams.set("withRecordings", "true");

    console.log("telavox-calls → GET", url.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    const rawBody = await response.text();

    if (!response.ok) {
      console.error("telavox-calls ← non-OK", response.status, rawBody.slice(0, 500));
      return new Response(JSON.stringify({
        error: `Telavox API error [${response.status}]`,
        detail: rawBody.slice(0, 400),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let data: any;
    try { data = JSON.parse(rawBody); } catch {
      return new Response(JSON.stringify({ error: "Telavox returned non-JSON", detail: rawBody.slice(0, 200) }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const calls: any[] = [];
    const mapCalls = (arr: any[], direction: string, fallbackStatus: string) => {
      if (!Array.isArray(arr)) return;
      for (const c of arr) {
        const dt = c.datetimeISO || c.datetime || "";
        const date = dt.slice(0, 10);
        const time = dt.includes("T") ? dt.slice(11, 16) : (dt.split(" ")[1] || "").slice(0, 5);
        calls.push({
          id: c.recordingId && c.recordingId !== "0" ? c.recordingId : `${date}-${time}-${Math.random().toString(36).slice(2, 8)}`,
          date,
          time,
          direction,
          duration: c.duration || 0,
          status: c.duration > 0 ? "answered" : fallbackStatus,
          phone: c.number || "unknown",
          recordingUrl: c.recordingId && c.recordingId !== "0" ? c.recordingId : undefined,
        });
      }
    };

    // Telavox shape: { incoming, outgoing, missed } — but also gracefully handle a flat list
    if (Array.isArray(data)) {
      mapCalls(data, "outbound", "missed");
    } else {
      mapCalls(data.incoming, "inbound", "missed");
      mapCalls(data.outgoing, "outbound", "missed");
      mapCalls(data.missed, "inbound", "missed");
    }

    calls.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    return new Response(JSON.stringify({ calls, total: calls.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("telavox-calls error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
