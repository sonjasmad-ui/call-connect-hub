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

async function enrichWithPipedrive(calls: any[], pdToken: string) {
  const uniquePhones = Array.from(new Set(calls.map((c) => c.phone).filter((p: string) => p && p !== "unknown")));
  const cache = new Map<string, { contactName?: string; company?: string }>();
  const lookup = async (phone: string) => {
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { apiKey: bodyKey, baseUrl, fromDate, toDate } = await req.json();
    const apiKey = (bodyKey && String(bodyKey).trim()) || Deno.env.get("TELAVOX_API_KEY") || "";
    const statsToken = (Deno.env.get("TELAVOX_STATS_TOKEN") || "").trim();

    if (!apiKey && !statsToken) {
      return new Response(JSON.stringify({ error: "Telavox not configured (set TELAVOX_API_KEY or TELAVOX_STATS_TOKEN)" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Stream Liner Historic (GraphQL) — preferred when stats token is set ───
    let usedStatsApi = false;
    let statsCalls: any[] | null = null;
    let statsError: string | null = null;

    if (statsToken && fromDate && toDate) {
      // ISO 8601 UTC range covering the full local day(s).
      const fromIso = `${fromDate}T00:00:00Z`;
      const toIso = `${toDate}T23:59:59Z`;
      const query = `query Historic($filter: OverviewFilter, $first: Int!, $after: String) {
  calls(filter: $filter, first: $first, after: $after) {
    data {
      idCall
      callDirection
      answered
      recorded
      terminatedCallReason
      timestamp
      time { start end }
      duration { total talk }
      customerTarget { number }
    }
    totalCount
    cursor
    hasNextPage
  }
}`;
      try {
        const aggregated: any[] = [];
        let cursor: string | null = null;
        let pages = 0;
        while (pages < 50) {
          const r = await fetch("https://statistics-api.telavox.se/graphql", {
            method: "POST",
            headers: { Authorization: `Bearer ${statsToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              variables: { filter: { startDate: fromIso, endDate: toIso }, first: 500, after: cursor },
            }),
          });
          const txt = await r.text();
          let json: any; try { json = JSON.parse(txt); } catch { throw new Error(`GraphQL non-JSON: ${txt.slice(0, 200)}`); }
          if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 400)}`);
          const conn = json?.data?.calls;
          if (!conn) throw new Error(`Unexpected GraphQL shape: ${txt.slice(0, 200)}`);
          for (const n of (conn.data || [])) aggregated.push(n);
          if (!conn.hasNextPage || !conn.cursor) break;
          cursor = conn.cursor;
          pages++;
        }
        statsCalls = aggregated;
        usedStatsApi = true;
        console.log(`telavox-calls(stats) ← ${aggregated.length} calls across ${pages + 1} page(s)`);
      } catch (e: any) {
        statsError = e?.message || String(e);
        console.error("telavox-calls(stats) failed, falling back to REST:", statsError);
      }
    }

    // If GraphQL succeeded, normalize and return early.
    if (usedStatsApi && statsCalls) {
      const normalized = statsCalls.map((c: any) => {
        const startMs = typeof c?.time?.start === "number" ? c.time.start
          : (c?.time?.start ? Date.parse(c.time.start) : 0);
        const dt = new Date(startMs || Date.now());
        const date = dt.toISOString().slice(0, 10);
        const time = dt.toISOString().slice(11, 16);
        const dur = c?.duration?.total ?? c?.duration?.talk ?? 0;
        const dirRaw = String(c?.callDirection || "").toLowerCase();
        const direction = dirRaw.startsWith("in") ? "inbound" : "outbound";
        let status = "missed";
        if (c?.answered) status = "answered";
        else if (c?.terminatedCallReason === "busy" || c?.terminatedCallReason === "user_busy") status = "busy";
        else if (c?.terminatedCallReason === "voicemail") status = "voicemail";
        return {
          id: c?.idCall || `${date}-${time}-${Math.random().toString(36).slice(2, 8)}`,
          date, time, direction,
          duration: dur,
          status,
          phone: c?.customerTarget?.number || "unknown",
          recordingUrl: undefined, // recording IDs only available via REST endpoint
        };
      }).sort((a: any, b: any) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

      // Pipedrive enrichment (same as REST path)
      const pdToken = Deno.env.get("PIPEDRIVE_API_TOKEN") || "";
      if (pdToken) await enrichWithPipedrive(normalized, pdToken);

      return new Response(JSON.stringify({
        calls: normalized,
        total: normalized.length,
        meta: { source: "stream-liner-historic" },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── REST fallback (recent-feed, ~30 cap) ───
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Stream Liner historic failed and no fallback REST key configured",
        detail: statsError,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    const deduped = Array.from(new Map(calls.map((call) => {
      const key = `${call.date}|${call.time}|${call.direction}|${call.phone}|${call.duration}|${call.recordingUrl || ""}`;
      return [key, call] as const;
    })).values());

    deduped.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

    console.log(`telavox-calls ← returned ${deduped.length} normalized records`);

    // Enrich with Pipedrive contact lookup (name + company) by phone number.
    const pdToken = Deno.env.get("PIPEDRIVE_API_TOKEN") || "";
    if (pdToken) await enrichWithPipedrive(deduped, pdToken);

    return new Response(JSON.stringify({
      calls: deduped,
      total: deduped.length,
      meta: {
        source: "rest-recent-feed",
        mayBeIncomplete: deduped.length >= 30,
        limitation: "Telavox REST /calls only exposes a recent-call feed (~30). Configure TELAVOX_STATS_TOKEN (Stream Liner Historic) for full historic counts.",
        statsAttempted: !!statsError,
        statsError: statsError || undefined,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("telavox-calls error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
