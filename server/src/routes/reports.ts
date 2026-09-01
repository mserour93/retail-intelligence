import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { allowedStoreIds } from "../rbac/users.js";
import { createReport, getReport, listReports, removeReport, updateReport } from "../reports/store.js";
import { executeReport } from "../reports/execute.js";
import { listKpiDefinitions } from "../semantic/kpiDictionary.js";
import type { ReportDefinitionInput } from "../reports/types.js";

export const reportsRouter = Router();
reportsRouter.use(authMiddleware);

reportsRouter.get("/kpi-dictionary", (_req, res) => {
  res.json({ kpis: listKpiDefinitions() });
});

reportsRouter.get("/", (req, res) => {
  res.json({ reports: listReports(req.user!.id) });
});

reportsRouter.post("/", (req, res) => {
  const input = req.body as ReportDefinitionInput;
  if (!input?.name || !input?.metrics?.length) {
    return res.status(400).json({ error: "name and at least one metric are required" });
  }
  const def = createReport({ ...input, owner: req.user!.id });
  res.status(201).json({ report: def });
});

reportsRouter.get("/:id", (req, res) => {
  const def = getReport(req.params.id);
  if (!def) return res.status(404).json({ error: "Report not found" });
  res.json({ report: def });
});

reportsRouter.patch("/:id", (req, res) => {
  const updated = updateReport(req.params.id, req.body as Partial<ReportDefinitionInput>);
  if (!updated) return res.status(404).json({ error: "Report not found" });
  res.json({ report: updated });
});

reportsRouter.delete("/:id", (req, res) => {
  const ok = removeReport(req.params.id);
  if (!ok) return res.status(404).json({ error: "Report not found" });
  res.status(204).end();
});

reportsRouter.post("/:id/execute", (req, res) => {
  const def = getReport(req.params.id);
  if (!def) return res.status(404).json({ error: "Report not found" });
  const allowed = new Set(allowedStoreIds(req.user!));
  const result = executeReport(def, allowed);
  res.json(result);
});

// Preview: execute an ad-hoc definition without saving (used by the report builder UI live preview).
reportsRouter.post("/preview", (req, res) => {
  const input = req.body as ReportDefinitionInput;
  if (!input?.metrics?.length) return res.status(400).json({ error: "At least one metric is required" });
  const now = new Date().toISOString();
  const def = { ...input, id: "preview", owner: req.user!.id, version: 0, createdDate: now, updatedDate: now };
  const allowed = new Set(allowedStoreIds(req.user!));
  const result = executeReport(def, allowed);
  res.json(result);
});
