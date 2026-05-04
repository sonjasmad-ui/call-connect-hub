import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function normalizeBase(input?: string): string {
  let b = (input || "").trim();
  if (!b || b.includes("your-company")) return "https://api.pipedrive.com/api/v1";
  b = b.replace(/\/+$/, "");
  if (!/\/api\/v\d+$/.test(b)) b += "/api/v1";
  return b;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiToken, baseUrl, startDate, endDate, userId, type } = await req.json();

    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Pipedrive API token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = normalizeBase(baseUrl);

    const url = new URL(`${base}/activities`);
    url.searchParams.set("api_token", apiToken);
    // Only filter by type if explicitly provided — Pipedrive activity keys vary per account.
    if (type) url.searchParams.set("type", type);
    // Pipedrive requires both start_date and end_date together, otherwise 400.
    if (startDate && endDate) {
      url.searchParams.set("start_date", startDate);
      url.searchParams.set("end_date", endDate);
    }
    if (userId) url.searchParams.set("user_id", String(userId));
    url.searchParams.set("limit", "500");

    const safeUrl = url.toString().replace(apiToken, "***");
    console.log("pipedrive-activities → GET", safeUrl);

    const response = await fetch(url.toString());
    const rawBody = await response.text();

    if (!response.ok) {
      console.error("pipedrive-activities ← non-OK", response.status, rawBody.slice(0, 500));
      let detail: any = rawBody;
      try { detail = JSON.parse(rawBody); } catch {}
      const apiMsg = (detail && (detail.error || detail.message)) || rawBody.slice(0, 200);
      return new Response(JSON.stringify({
        error: `Pipedrive API error [${response.status}]`,
        detail: apiMsg,
      }), {
        status: 200, // return 200 so client invoke() resolves and we can read JSON cleanly
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data: any;
    try { data = JSON.parse(rawBody); } catch {
      return new Response(JSON.stringify({ error: "Pipedrive returned non-JSON response", detail: rawBody.slice(0, 200) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allActivities = data.data || [];
    // Client-side filter to meetings (default) unless caller passed a different type.
    const wanted = type || "meeting";
    const filtered = allActivities.filter((a: any) => !type ? a.type === wanted : true);

    const meetings = filtered.map((a: any) => ({
      id: String(a.id),
      title: a.subject || "Meeting",
      contactName: a.person_name || "Unknown",
      company: a.org_name || "",
      date: a.due_date || "",
      time: a.due_time || "",
      createdDate: a.add_time ? a.add_time.slice(0, 10) : a.due_date || "",
      pipedriveStage: a.deal_title || "Lead",
      dealValue: a.deal_id || undefined,
      done: a.done === 1,
      userId: a.user_id,
      type: a.type,
    }));

    return new Response(JSON.stringify({ meetings, total: meetings.length, fetched: allActivities.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pipedrive-activities error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
