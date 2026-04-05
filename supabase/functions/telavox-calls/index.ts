import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiKey, baseUrl, fromDate, toDate, extension } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Telavox API key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = baseUrl || "https://api.telavox.se";
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // If extension is specified, we need to make the call on behalf of that extension
    const callsUrl = new URL(`${base}/calls`);
    if (fromDate) callsUrl.searchParams.set("fromDate", fromDate);
    if (toDate) callsUrl.searchParams.set("toDate", toDate);
    callsUrl.searchParams.set("withRecordings", "true");

    // If extension provided, use the extension-specific endpoint
    const finalUrl = extension ? `${base}/calls?fromDate=${fromDate}&toDate=${toDate}&withRecordings=true` : callsUrl.toString();

    const response = await fetch(finalUrl, { headers });

    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `Telavox API error [${response.status}]`, detail: body }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Telavox returns { incoming: [...], outgoing: [...], missed: [...] }
    const calls: any[] = [];

    const mapCalls = (arr: any[], direction: string, status: string) => {
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
          status: c.duration > 0 ? "answered" : status,
          phone: c.number || "unknown",
          recordingUrl: c.recordingId && c.recordingId !== "0" ? c.recordingId : undefined,
        });
      }
    };

    mapCalls(data.incoming, "inbound", "missed");
    mapCalls(data.outgoing, "outbound", "missed");
    mapCalls(data.missed, "inbound", "missed");

    // Sort by date+time descending
    calls.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

    return new Response(JSON.stringify({ calls, total: calls.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("telavox-calls error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
