import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response("Missing id", { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get("TELAVOX_API_KEY") || "";
    if (!apiKey) {
      return new Response("TELAVOX_API_KEY not configured", { status: 500, headers: corsHeaders });
    }

    // Telavox call recording endpoint
    const tvxUrl = `https://api.telavox.se/recording/${encodeURIComponent(id)}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      Accept: "audio/*",
    };
    const range = req.headers.get("range");
    if (range) headers["Range"] = range;

    console.log("telavox-recording → GET", tvxUrl, range ? `range=${range}` : "");
    const upstream = await fetch(tvxUrl, { headers });

    if (!upstream.ok && upstream.status !== 206) {
      const text = await upstream.text();
      console.error("telavox-recording ← non-OK", upstream.status, text.slice(0, 200));
      return new Response(`Telavox error ${upstream.status}: ${text.slice(0, 200)}`, {
        status: upstream.status,
        headers: corsHeaders,
      });
    }

    const respHeaders = new Headers(corsHeaders);
    const passThrough = ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"];
    for (const h of passThrough) {
      const v = upstream.headers.get(h);
      if (v) respHeaders.set(h, v);
    }
    if (!respHeaders.has("content-type")) respHeaders.set("content-type", "audio/mpeg");

    return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
  } catch (error) {
    console.error("telavox-recording error:", error);
    return new Response(error instanceof Error ? error.message : "Unknown error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
