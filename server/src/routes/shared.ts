import { Router } from "express";
import { getShare } from "../reports/shares.js";
import { getReport } from "../reports/store.js";
import { executeReport } from "../reports/execute.js";
import { getUserById, allowedStoreIds } from "../rbac/users.js";

export const sharedRouter = Router();

/**
 * Public (no login) read-only view of a shared report — spec §49's "secure
 * link" sharing. Executed under the report owner's RBAC scope, so a shared
 * link never exposes more than the owner themself could see.
 */
sharedRouter.get("/:token", (req, res) => {
  const link = getShare(req.params.token);
  if (!link) return res.status(404).json({ error: "This share link is invalid or has expired." });
  const def = getReport(link.reportId);
  if (!def) return res.status(404).json({ error: "The shared report no longer exists." });
  const owner = getUserById(link.ownerUserId);
  if (!owner) return res.status(404).json({ error: "Report owner not found." });

  const allowed = new Set(allowedStoreIds(owner));
  const result = executeReport(def, allowed);
  res.json({ result, sharedBy: owner.name, sharedAt: link.createdAt });
});
