import { Router } from "express";

export const pipedriveRouter = Router();

const BASE = () => process.env.PIPEDRIVE_BASE_URL || "https://api.pipedrive.com/api/v1";
const token = () => process.env.PIPEDRIVE_API_TOKEN;

// GET /api/pipedrive/activities?type=meeting&start=2026-04-01&end=2026-04-03
pipedriveRouter.get("/activities", async (req, res) => {
  try {
    const { type = "meeting", start, end } = req.query;

    const url = new URL(`${BASE()}/activities`);
    url.searchParams.set("api_token", token());
    url.searchParams.set("type", type);
    if (start) url.searchParams.set("start_date", start);
    if (end) url.searchParams.set("end_date", end);
    url.searchParams.set("done", "0"); // upcoming
    url.searchParams.set("limit", "100");

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: `Pipedrive API error [${response.status}]`, detail: body });
    }

    const data = await response.json();
    const meetings = (data.data || []).map((a) => ({
      id: String(a.id),
      title: a.subject || "Meeting",
      contactName: a.person_name || "Unknown",
      company: a.org_name || "",
      date: a.due_date || "",
      time: a.due_time || "",
      pipedriveStage: a.deal_title ? "Discovery" : "Lead",
      dealValue: a.deal_id ? undefined : undefined, // fetched separately if needed
    }));

    res.json({ meetings, total: data.additional_data?.pagination?.total || meetings.length });
  } catch (err) {
    console.error("Pipedrive activities error:", err);
    res.status(500).json({ error: "Failed to fetch activities from Pipedrive" });
  }
});

// GET /api/pipedrive/person/search?phone=+4520123456
// Used to enrich Telavox calls with contact/company names
pipedriveRouter.get("/person/search", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "phone query param required" });

    const url = new URL(`${BASE()}/persons/search`);
    url.searchParams.set("api_token", token());
    url.searchParams.set("term", phone);
    url.searchParams.set("fields", "phone");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(response.status).json({ error: `Pipedrive search error [${response.status}]` });
    }

    const data = await response.json();
    const item = data.data?.items?.[0]?.item;

    if (item) {
      res.json({
        found: true,
        contactName: item.name || "Unknown",
        company: item.organization?.name || "",
        personId: item.id,
      });
    } else {
      res.json({ found: false });
    }
  } catch (err) {
    console.error("Pipedrive person search error:", err);
    res.status(500).json({ error: "Failed to search Pipedrive contacts" });
  }
});

// GET /api/pipedrive/deals?status=open
pipedriveRouter.get("/deals", async (req, res) => {
  try {
    const { status = "open" } = req.query;

    const url = new URL(`${BASE()}/deals`);
    url.searchParams.set("api_token", token());
    url.searchParams.set("status", status);
    url.searchParams.set("limit", "50");
    url.searchParams.set("sort", "update_time DESC");

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: `Pipedrive API error [${response.status}]`, detail: body });
    }

    const data = await response.json();
    const deals = (data.data || []).map((d) => ({
      id: String(d.id),
      title: d.title,
      value: d.value,
      currency: d.currency,
      stage: d.stage_id,
      contactName: d.person_name || "",
      company: d.org_name || "",
      status: d.status,
    }));

    res.json({ deals });
  } catch (err) {
    console.error("Pipedrive deals error:", err);
    res.status(500).json({ error: "Failed to fetch deals from Pipedrive" });
  }
});
