import { Router } from "express";
import { USERS, getUserById } from "../rbac/users.js";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { recordAudit } from "../audit/log.js";

export const authRouter = Router();

// Public: list mock personas for the login picker (spec §40: mock SSO).
authRouter.get("/personas", (_req, res) => {
  res.json({
    personas: USERS.map((u) => ({ id: u.id, name: u.name, role: u.role, areaIds: u.areaIds, storeIds: u.storeIds })),
  });
});

// Mock SSO sign-in. Records the login in the audit trail (spec §50).
authRouter.post("/login", (req, res) => {
  const { userId } = req.body as { userId?: string };
  const user = userId ? getUserById(userId) : undefined;
  if (!user) return res.status(401).json({ error: "Unknown user id" });
  recordAudit({ userId: user.id, userName: user.name, role: user.role, eventType: "login", detail: "Signed in", dataScope: null });
  res.json({ user });
});

authRouter.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
