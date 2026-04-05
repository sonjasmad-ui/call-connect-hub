import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiKey, baseUrl } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Telavox API key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = baseUrl || "https://api.telavox.se";
    const response = await fetch(`${base}/extensions/`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `Telavox API error [${response.status}]`, detail: body }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Telavox returns array of extensions
    const users = (Array.isArray(data) ? data : []).map((ext: any) => ({
      id: ext.extension,
      name: ext.name || ext.extension,
      email: ext.email || "",
      extension: ext.extension,
    }));

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("telavox-users error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
