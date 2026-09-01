import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { getDataControlStatus } from "../dataControl/status.js";

export const dataControlRouter = Router();
dataControlRouter.use(authMiddleware);

dataControlRouter.get("/", (_req, res) => {
  res.json({ sources: getDataControlStatus() });
});
