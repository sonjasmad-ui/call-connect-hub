import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiToken, baseUrl, startDate, endDate, userId, type = "meeting" } = await req.json();

    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Pipedrive API token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = baseUrl || "https://api.pipedrive.com/api/v1";

    const url = new URL(`${base}/activities`);
    url.searchParams.set("api_token", apiToken);
    url.searchParams.set("type", type);
    if (startDate) url.searchParams.set("start_date", startDate);
    if (endDate) url.searchParams.set("end_date", endDate);
    if (userId) url.searchParams.set("user_id", String(userId));
    url.searchParams.set("limit", "500");

    const response = await fetch(url.toString());

    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `Pipedrive API error [${response.status}]`, detail: body }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    const meetings = (data.data || []).map((a: any) => ({
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
    }));

    return new Response(JSON.stringify({ meetings, total: data.additional_data?.pagination?.total || meetings.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pipedrive-activities error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
