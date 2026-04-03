import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { telavoxRouter } from "./routes/telavox.js";
import { pipedriveRouter } from "./routes/pipedrive.js";

dotenv.config({ path: "./server/.env" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  const telavoxReady = !!process.env.TELAVOX_API_KEY && process.env.TELAVOX_API_KEY !== "your_telavox_api_key";
  const pipedriveReady = !!process.env.PIPEDRIVE_API_TOKEN && process.env.PIPEDRIVE_API_TOKEN !== "your_pipedrive_api_token";
  res.json({
    status: "ok",
    integrations: {
      telavox: telavoxReady ? "connected" : "not configured",
      pipedrive: pipedriveReady ? "connected" : "not configured",
    },
  });
});

app.use("/api/telavox", telavoxRouter);
app.use("/api/pipedrive", pipedriveRouter);

app.listen(PORT, () => {
  console.log(`🚀 CallTrack API running on http://localhost:${PORT}`);
  console.log(`   Telavox:   ${process.env.TELAVOX_API_KEY ? "✅ configured" : "⚠️  not configured (add to server/.env)"}`);
  console.log(`   Pipedrive: ${process.env.PIPEDRIVE_API_TOKEN ? "✅ configured" : "⚠️  not configured (add to server/.env)"}`);
});
