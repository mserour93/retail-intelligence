import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { enforceScope, defaultDateFrom, defaultDateTo } from "../rbac/scope.js";
import { computeInventoryKpis, computeKpis } from "../semantic/kpiEngine.js";
import { findRedFlags } from "../engines/redFlagEngine.js";
import { findOpportunities } from "../engines/opportunityEngine.js";
import { computeHealthScore } from "../engines/healthScore.js";

export const briefRouter = Router();
briefRouter.use(authMiddleware);

/**
 * Daily Retail Brief (spec §45): "Give me CEO version" / "Area Manager
 * version" / "5 bullets only". Built from the same certified KPI/red-flag/
 * opportunity engines as the control tower and AI — no separate summarizer,
 * no invented numbers.
 */
briefRouter.get("/", (req, res) => {
  const user = req.user!;
  const dateFrom = (req.query.from as string) ?? defaultDateFrom();
  const dateTo = (req.query.to as string) ?? defaultDateTo();
  const bulletsOnly = req.query.bullets === "5" || req.query.bullets === "true";
  const scope = enforceScope(user, { dateFrom, dateTo });

  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);
  const health = computeHealthScore(scope);
  const redFlags = findRedFlags(scope);
  const opportunities = findOpportunities(scope);

  const bullets = [
    `Health score ${health.score}/100.`,
    `Net sales SAR ${Math.round(kpis.current.NET_SALES).toLocaleString()} (${(kpis.salesGrowthPct * 100).toFixed(1)}% vs prior period, ${(kpis.current.SALES_VS_TARGET_PCT * 100).toFixed(1)}% vs target).`,
    `Margin ${(kpis.current.GROSS_MARGIN_PCT * 100).toFixed(1)}% (${kpis.marginChangePp >= 0 ? "+" : ""}${(kpis.marginChangePp * 100).toFixed(1)}pp vs prior period).`,
    `Availability ${(inv.AVAILABILITY_PCT * 100).toFixed(1)}%.`,
    redFlags.length
      ? `Top red flag: ${redFlags[0].entityLabel} — ${redFlags[0].reason}`
      : "No open red flags.",
  ].slice(0, 5);

  if (bulletsOnly) {
    return res.json({ variant: "5-bullets", role: user.role, period: { from: dateFrom, to: dateTo }, bullets });
  }

  res.json({
    variant: user.role,
    period: { from: dateFrom, to: dateTo },
    headline: `Health ${health.score}/100 — Net sales SAR ${Math.round(kpis.current.NET_SALES).toLocaleString()} (${(kpis.salesGrowthPct * 100).toFixed(1)}% vs prior period)`,
    bullets,
    redFlags: redFlags.slice(0, 5),
    opportunities: opportunities.slice(0, 3),
    dataAsOf: new Date().toISOString(),
  });
});
