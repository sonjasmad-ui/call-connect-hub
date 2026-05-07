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

    // Enrich with Pipedrive contact lookup (name + company) by phone number.
    const pdToken = Deno.env.get("PIPEDRIVE_API_TOKEN") || "";
    if (pdToken) {
      const uniquePhones = Array.from(new Set(calls.map(c => c.phone).filter(p => p && p !== "unknown")));
      const cache = new Map<string, { contactName?: string; company?: string }>();
      const lookup = async (phone: string) => {
        // Try as-is, then digits only, then last 8 digits (DK local) — Pipedrive search ignores spaces.
        const digits = phone.replace(/\D/g, "");
        const variants = Array.from(new Set([phone, digits, digits.slice(-8)])).filter(Boolean);
        for (const term of variants) {
          try {
            const u = new URL("https://api.pipedrive.com/api/v2/persons/search");
            u.searchParams.set("api_token", pdToken);
            u.searchParams.set("term", term);
            u.searchParams.set("fields", "phone");
            u.searchParams.set("limit", "1");
            const r = await fetch(u.toString());
            if (!r.ok) continue;
            const j = await r.json();
            const item = j?.data?.items?.[0]?.item;
            if (item) return { contactName: item.name, company: item.organization?.name };
          } catch {}
        }
        return {};
      };
      // Limit concurrency to avoid rate limits.
      const queue = [...uniquePhones];
      const workers = Array.from({ length: 5 }, async () => {
        while (queue.length) {
          const p = queue.shift()!;
          cache.set(p, await lookup(p));
        }
      });
      await Promise.all(workers);
      for (const c of calls) {
        const hit = cache.get(c.phone);
        if (hit) { c.contactName = hit.contactName; c.company = hit.company; }
      }
    }

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
