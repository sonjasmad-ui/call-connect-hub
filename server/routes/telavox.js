import { Router } from "express";

export const telavoxRouter = Router();

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.TELAVOX_API_KEY}`,
  "Content-Type": "application/json",
});

const BASE = () => process.env.TELAVOX_BASE_URL || "https://api.telavox.se/v1";

// GET /api/telavox/calls?from=2026-04-01&to=2026-04-03
telavoxRouter.get("/calls", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to query params required" });

    const response = await fetch(`${BASE()}/calls?from=${from}&to=${to}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: `Telavox API error [${response.status}]`, detail: body });
    }

    const data = await response.json();

    // Normalize Telavox response to our CallRecord format
    const calls = (data.calls || data.items || data || []).map((c) => ({
      id: c.id || c.callId || String(Date.now() + Math.random()),
      date: c.date || c.startTime?.slice(0, 10) || "",
      time: c.time || c.startTime?.slice(11, 16) || "",
      direction: c.direction === "in" || c.direction === "inbound" ? "inbound" : "outbound",
      duration: c.duration || c.talkTime || 0,
      status: normalizeStatus(c.status || c.result),
      phone: c.phone || c.remoteNumber || c.callerNumber || "",
      recordingUrl: c.recordingUrl || c.recording?.url || undefined,
      notes: c.notes || undefined,
    }));

    res.json({ calls });
  } catch (err) {
    console.error("Telavox calls error:", err);
    res.status(500).json({ error: "Failed to fetch calls from Telavox" });
  }
});

// GET /api/telavox/recording/:id
telavoxRouter.get("/recording/:id", async (req, res) => {
  try {
    const response = await fetch(`${BASE()}/recordings/${req.params.id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Recording fetch failed [${response.status}]` });
    }

    // Stream the audio back
    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Recording error:", err);
    res.status(500).json({ error: "Failed to fetch recording" });
  }
});

function normalizeStatus(status) {
  if (!status) return "missed";
  const s = status.toLowerCase();
  if (s.includes("answer") || s === "connected") return "answered";
  if (s.includes("busy")) return "busy";
  if (s.includes("voicemail") || s.includes("vm")) return "voicemail";
  return "missed";
}
