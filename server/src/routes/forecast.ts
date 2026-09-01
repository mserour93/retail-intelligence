import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { enforceScope, defaultDateFrom, defaultDateTo } from "../rbac/scope.js";
import { computeForecast } from "../engines/forecast.js";

export const forecastRouter = Router();
forecastRouter.use(authMiddleware);

forecastRouter.get("/", (req, res) => {
  const user = req.user!;
  const scope = enforceScope(user, { dateFrom: defaultDateFrom(), dateTo: defaultDateTo() });
  res.json(computeForecast(scope));
});
