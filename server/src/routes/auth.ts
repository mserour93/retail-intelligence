import { Router } from "express";
import { USERS } from "../rbac/users.js";
import { authMiddleware } from "../rbac/authMiddleware.js";

export const authRouter = Router();

// Public: list mock personas for the login picker (spec §40: mock SSO).
authRouter.get("/personas", (_req, res) => {
  res.json({
    personas: USERS.map((u) => ({ id: u.id, name: u.name, role: u.role, areaIds: u.areaIds, storeIds: u.storeIds })),
  });
});

authRouter.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
