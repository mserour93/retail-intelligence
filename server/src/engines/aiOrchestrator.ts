import { areas, categories, stores } from "../data/masters.js";
import { enforceScope, defaultDateFrom, defaultDateTo } from "../rbac/scope.js";
import type { AppUser } from "../rbac/users.js";
import { computeInventoryKpis, computeKpis, type QueryScope } from "../semantic/kpiEngine.js";
import { findRedFlags, type RedFlag } from "./redFlagEngine.js";
import { findOpportunities, type Opportunity } from "./opportunityEngine.js";
import { computeHealthScore } from "./healthScore.js";

/**
 * Rule-based conversational AI. This environment has no hosted LLM key
 * configured (spec §35/§38 call for OpenAI or an equivalent provider behind
 * a server-side orchestration layer) — this module is a deterministic
 * stand-in that follows the same tool-contract shape (getKpi, findRedFlags,
 * findOpportunities, queryReport-equivalent) a real LLM tool-calling loop
 * would use (§36). Swap the `matchIntent` step below for a real model call
 * that selects the same tools; nothing else in the app needs to change.
 *
 * It never invents numbers: every value in a response comes from
 * `computeKpis` / `findRedFlags` / `findOpportunities`, which read only the
 * certified KPI dictionary and the RBAC-scoped facts.
 */

export interface AiAnswer {
  executiveAnswer: string;
  keyNumbers: Array<{ label: string; value: string }>;
  whatHappened: string;
  why: string;
  redFlags: RedFlag[];
  opportunities: Opportunity[];
  suggestedConsiderations: string[];
  takeaways: string[];
  dataContext: {
    period: { from: string; to: string };
    filters: string;
    dataAsOf: string;
    dataSource: string;
    confidence: "high" | "medium" | "low";
    confidenceReason: string;
  };
}

function resolveEntityScope(question: string, user: AppUser): Partial<QueryScope> {
  const lower = question.toLowerCase();
  const area = areas.find((a) => lower.includes(a.name.toLowerCase()));
  const store = stores.find((s) => lower.includes(s.name.toLowerCase()) || lower.includes(s.code));
  const category = categories.find((c) => lower.includes(c.name.toLowerCase()));
  const scope: Partial<QueryScope> = {};
  if (store) scope.storeIds = [store.id];
  else if (area) scope.areaIds = [area.id];
  if (category) scope.categoryIds = [category.id];
  return scope;
}

type Intent = "red_flags" | "opportunities" | "why" | "summary" | "care_about" | "kpi";

function matchIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/(what should i care about|top issues|biggest risk)/.test(q)) return "care_about";
  if (/(red flag|risk|worst|problem|declin)/.test(q)) return "red_flags";
  if (/(opportunit|grow faster|upside)/.test(q)) return "opportunities";
  if (/^why|caused|driving|driver/.test(q)) return "why";
  if (/(summary|brief|morning|meeting)/.test(q)) return "summary";
  return "kpi";
}

export function askAi(question: string, user: AppUser): AiAnswer {
  const requested = resolveEntityScope(question, user);
  const scope = enforceScope(user, {
    dateFrom: requested.dateFrom ?? defaultDateFrom(),
    dateTo: requested.dateTo ?? defaultDateTo(),
    storeIds: requested.storeIds,
    areaIds: requested.areaIds,
    categoryIds: requested.categoryIds,
  });

  const intent = matchIntent(question);
  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);
  const redFlags = findRedFlags(scope);
  const opportunities = findOpportunities(scope);
  const health = computeHealthScore(scope);

  const dataContext = {
    period: { from: scope.dateFrom, to: scope.dateTo },
    filters: describeScope(scope),
    dataAsOf: new Date().toISOString(),
    dataSource: "Synthetic mock dataset (server/src/data/generate.ts) — no live POS/ERP feed connected in this environment.",
    confidence: (scope.storeIds && scope.storeIds.length === 0 ? "low" : redFlags.length + opportunities.length > 0 ? "high" : "medium") as
      | "high"
      | "medium"
      | "low",
    confidenceReason:
      scope.storeIds && scope.storeIds.length === 0
        ? "You have no stores in scope for this question — check your role/area assignment."
        : "Certified KPI definitions, complete synthetic dataset for the selected period.",
  };

  const keyNumbers = [
    { label: "Net Sales", value: `SAR ${kpis.current.NET_SALES.toLocaleString()}` },
    { label: "Sales vs Prior Period", value: `${(kpis.salesGrowthPct * 100).toFixed(1)}%` },
    { label: "Sales vs Target", value: `${(kpis.current.SALES_VS_TARGET_PCT * 100).toFixed(1)}%` },
    { label: "Gross Margin %", value: `${(kpis.current.GROSS_MARGIN_PCT * 100).toFixed(1)}%` },
    { label: "Availability", value: `${(inv.AVAILABILITY_PCT * 100).toFixed(1)}%` },
    { label: "Retail Health Score", value: `${health.score}/100` },
  ];

  const topFlag = redFlags[0];
  const topOpp = opportunities[0];

  let executiveAnswer: string;
  let whatHappened: string;
  let why: string;
  let considerations: string[];

  switch (intent) {
    case "care_about":
      executiveAnswer = topFlag
        ? `Focus first on ${topFlag.entityLabel}: ${topFlag.reason}`
        : "No critical issues in this scope right now — health looks stable.";
      whatHappened = redFlags.slice(0, 5).map((f) => `${f.entityLabel}: ${f.reason}`).join(" ");
      why = topFlag?.reason ?? "No dominant driver detected.";
      considerations = topFlag?.suggestedConsiderations ?? [];
      break;
    case "red_flags":
      executiveAnswer = topFlag
        ? `${redFlags.length} red flag(s) in scope. Most severe: ${topFlag.entityLabel} — ${topFlag.kpiLabel} at ${(topFlag.currentValue * 100).toFixed(1)}%.`
        : "No red flags detected in this scope for the selected period.";
      whatHappened = topFlag?.reason ?? "";
      why = topFlag?.reason ?? "";
      considerations = topFlag?.suggestedConsiderations ?? [];
      break;
    case "opportunities":
      executiveAnswer = topOpp
        ? `${opportunities.length} opportunity(ies) in scope. Top: ${topOpp.entityLabel} — ${topOpp.title}.`
        : "No standout opportunities detected in this scope for the selected period.";
      whatHappened = topOpp?.description ?? "";
      why = topOpp?.description ?? "";
      considerations = topOpp?.suggestedConsiderations ?? [];
      break;
    case "why":
      executiveAnswer = topFlag
        ? `${topFlag.entityLabel}'s ${topFlag.kpiLabel} moved because: ${topFlag.reason}`
        : `Sales are ${(kpis.salesGrowthPct * 100).toFixed(1)}% vs the prior period; no single dominant driver crossed a red-flag threshold.`;
      whatHappened = `Net sales SAR ${kpis.current.NET_SALES.toLocaleString()} vs SAR ${kpis.prior.NET_SALES.toLocaleString()} prior period.`;
      why = topFlag?.reason ?? "Change is broad-based across the scope rather than concentrated in one driver.";
      considerations = topFlag?.suggestedConsiderations ?? ["Drill down by store or category to isolate the driver."];
      break;
    case "summary":
    default:
      executiveAnswer = `Net sales SAR ${kpis.current.NET_SALES.toLocaleString()} (${(kpis.salesGrowthPct * 100).toFixed(1)}% vs prior period), margin ${(kpis.current.GROSS_MARGIN_PCT * 100).toFixed(1)}%, health score ${health.score}/100.`;
      whatHappened = `${redFlags.length} red flag(s) and ${opportunities.length} opportunity(ies) identified in scope.`;
      why = topFlag?.reason ?? "No critical driver this period.";
      considerations = [...(topFlag?.suggestedConsiderations ?? []), ...(topOpp?.suggestedConsiderations ?? [])].slice(0, 4);
      break;
  }

  const takeaways = [
    `Sales vs target: ${(kpis.current.SALES_VS_TARGET_PCT * 100).toFixed(1)}%.`,
    `Margin change vs prior period: ${(kpis.marginChangePp * 100).toFixed(1)}pp.`,
    `Availability: ${(inv.AVAILABILITY_PCT * 100).toFixed(1)}%.`,
    redFlags.length ? `${redFlags.length} red flag(s) open in this scope.` : "No open red flags in this scope.",
    opportunities.length ? `${opportunities.length} opportunity(ies) identified.` : "No standout opportunities this period.",
  ];

  return {
    executiveAnswer,
    keyNumbers,
    whatHappened,
    why,
    redFlags: redFlags.slice(0, 5),
    opportunities: opportunities.slice(0, 5),
    suggestedConsiderations: considerations,
    takeaways,
    dataContext,
  };
}

function describeScope(scope: QueryScope): string {
  const parts: string[] = [`${scope.dateFrom} to ${scope.dateTo}`];
  if (scope.storeIds && scope.storeIds.length) parts.push(`${scope.storeIds.length} store(s)`);
  if (scope.categoryIds && scope.categoryIds.length) parts.push(`categories: ${scope.categoryIds.join(", ")}`);
  return parts.join(" | ");
}
