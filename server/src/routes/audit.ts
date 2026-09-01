import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { listAudit } from "../audit/log.js";

export const auditRouter = Router();
auditRouter.use(authMiddleware);

// Each user sees only their own audit trail in this MVP (no admin role modeled yet).
auditRouter.get("/", (req, res) => {
  res.json({ entries: listAudit(req.user!.id) });
});
