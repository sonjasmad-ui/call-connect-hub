import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function normalizeBase(input?: string): string {
  let b = (input || "").trim();
  if (!b) return "https://api.telavox.se";
  b = b.replace(/\/+$/, "").replace(/\/v\d+$/, "");
  return b;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { apiKey: bodyKey, baseUrl } = await req.json().catch(() => ({}));
    const apiKey = (bodyKey && String(bodyKey).trim()) || Deno.env.get("TELAVOX_API_KEY") || "";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Telavox API key not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = normalizeBase(baseUrl);
    const response = await fetch(`${base}/extensions/`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    const rawBody = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Telavox API error [${response.status}]`, detail: rawBody.slice(0, 400) }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data: any = [];
    try { data = JSON.parse(rawBody); } catch {}
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
