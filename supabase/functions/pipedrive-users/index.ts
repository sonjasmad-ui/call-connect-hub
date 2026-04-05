import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";

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

    const base = baseUrl || "https://api.pipedrive.com/api/v1";

    const url = new URL(`${base}/users`);
    url.searchParams.set("api_token", apiToken);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `Pipedrive API error [${response.status}]`, detail: body }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
