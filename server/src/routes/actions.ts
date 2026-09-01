import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { createAction, listActions, updateActionStatus, type DecisionType } from "../actions/store.js";
import { recordAudit } from "../audit/log.js";

export const actionsRouter = Router();
actionsRouter.use(authMiddleware);

const VALID_DECISIONS: DecisionType[] = [
  "investigate",
  "contact_store",
  "discuss_category",
  "review_pricing",
  "review_inventory",
  "monitor",
  "not_relevant",
  "already_handled",
];

actionsRouter.get("/", (req, res) => {
  res.json({ actions: listActions(req.user!.id) });
});

actionsRouter.post("/", (req, res) => {
  const { refType, refId, decision, note, assignedToUserId, followUpDate } = req.body as {
    refType?: "red_flag" | "opportunity";
    refId?: string;
    decision?: DecisionType;
    note?: string;
    assignedToUserId?: string;
    followUpDate?: string;
  };
  if (!refType || !refId || !decision || !VALID_DECISIONS.includes(decision)) {
    return res.status(400).json({ error: "refType, refId, and a valid decision are required" });
  }
  const action = createAction({
    refType,
    refId,
    decision,
    note: note ?? "",
    ownerUserId: req.user!.id,
    assignedToUserId,
    followUpDate,
  });
  recordAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    role: req.user!.role,
    eventType: "action_recorded",
    detail: `Recorded "${decision}" on ${refType} ${refId}`,
    dataScope: null,
  });
  res.status(201).json({ action });
});

actionsRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body as { status?: "open" | "resolved" };
  if (status !== "open" && status !== "resolved") return res.status(400).json({ error: "status must be open or resolved" });
  const updated = updateActionStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: "Action not found" });
  res.json({ action: updated });
});
