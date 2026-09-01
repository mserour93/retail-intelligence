import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { controlTowerRouter } from "./routes/controlTower.js";
import { drilldownRouter } from "./routes/drilldown.js";
import { commercialRouter } from "./routes/commercial.js";
import { reportsRouter } from "./routes/reports.js";
import { aiRouter } from "./routes/ai.js";
import { actionsRouter } from "./routes/actions.js";
import { ingestionRouter } from "./routes/ingestion.js";
import { dataControlRouter } from "./routes/dataControl.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/control-tower", controlTowerRouter);
  app.use("/api/v1/drilldown", drilldownRouter);
  app.use("/api/v1/commercial", commercialRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/actions", actionsRouter);
  app.use("/api/v1/data-control-center", dataControlRouter);
  app.use("/api/v1", ingestionRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  return app;
}
