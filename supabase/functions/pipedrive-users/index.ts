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
    const { apiToken, baseUrl } = await req.json();

    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Pipedrive API token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = normalizeBase(baseUrl);
    const url = new URL(`${base}/users`);
    url.searchParams.set("api_token", apiToken);

    const safeUrl = url.toString().replace(apiToken, "***");
    console.log("pipedrive-users → GET", safeUrl);

    const response = await fetch(url.toString());
    const rawBody = await response.text();

    if (!response.ok) {
      console.error("pipedrive-users ← non-OK", response.status, rawBody.slice(0, 500));
      let detail: any = rawBody;
      try { detail = JSON.parse(rawBody); } catch {}
      const apiMsg = (detail && (detail.error || detail.message)) || rawBody.slice(0, 200);
      return new Response(JSON.stringify({
        error: `Pipedrive API error [${response.status}]`,
        detail: apiMsg,
      }), {
        status: 200,
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

    const users = (data.data || []).map((u: any) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email || "",
      active: u.active_flag,
    }));

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pipedrive-users error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
