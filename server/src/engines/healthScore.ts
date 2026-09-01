import { ecommerceDaily } from "../data/generate.js";
import { computeInventoryKpis, computeKpis, type QueryScope } from "../semantic/kpiEngine.js";

export type HealthDomain =
  | "sales"
  | "margin"
  | "inventory"
  | "storeOperations"
  | "commercial"
  | "ecommerce";
// "customer" and "marketing" domains are in the target spec (§24) but this
// mock dataset has no customer identity / loyalty / campaign data to back
// them, so they're intentionally omitted rather than faked — see §31 (never
// fabricate an answer when the underlying data isn't there).

export const DEFAULT_WEIGHTS: Record<HealthDomain, number> = {
  sales: 0.3,
  margin: 0.2,
  inventory: 0.2,
  storeOperations: 0.15,
  commercial: 0.1,
  ecommerce: 0.05,
};

export interface DomainScore {
  domain: HealthDomain;
  score: number; // 0-100
  weight: number;
  contribution: number; // score * weight
  rationale: string;
}

export interface RetailHealthScore {
  score: number; // 0-100, weighted sum
  domains: DomainScore[];
  period: { from: string; to: string };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Maps a -1..+1-ish variance onto a 0-100 score centered at 70 for "on plan". */
function scoreFromVariance(variance: number, sensitivity: number): number {
  return clampScore(70 + variance * sensitivity);
}

export function computeHealthScore(
  scope: QueryScope,
  weights: Record<HealthDomain, number> = DEFAULT_WEIGHTS,
): RetailHealthScore {
  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);

  const salesScore = scoreFromVariance(kpis.current.SALES_VS_TARGET_PCT, 200);
  const marginScore = scoreFromVariance(kpis.marginChangePp, 1500);
  const inventoryScore = scoreFromVariance(inv.AVAILABILITY_PCT - 0.95, 600);
  const opsScore = scoreFromVariance(kpis.transactionGrowthPct, 250);
  const commercialScore = scoreFromVariance(kpis.salesGrowthPct, 250);

  const ecomWindow = ecommerceDaily.filter((e) => e.date >= scope.dateFrom && e.date <= scope.dateTo);
  const ecomSales = ecomWindow.reduce((a, e) => a + e.netSales, 0);
  const ecomScore = scoreFromVariance(ecomSales > 0 ? 0.02 : -0.3, 150);

  const domains: DomainScore[] = [
    { domain: "sales", score: salesScore, weight: weights.sales, contribution: 0, rationale: `Sales vs target: ${(kpis.current.SALES_VS_TARGET_PCT * 100).toFixed(1)}%` },
    { domain: "margin", score: marginScore, weight: weights.margin, contribution: 0, rationale: `Margin change: ${(kpis.marginChangePp * 100).toFixed(1)}pp vs prior period` },
    { domain: "inventory", score: inventoryScore, weight: weights.inventory, contribution: 0, rationale: `Availability: ${(inv.AVAILABILITY_PCT * 100).toFixed(1)}%` },
    { domain: "storeOperations", score: opsScore, weight: weights.storeOperations, contribution: 0, rationale: `Transaction growth: ${(kpis.transactionGrowthPct * 100).toFixed(1)}%` },
    { domain: "commercial", score: commercialScore, weight: weights.commercial, contribution: 0, rationale: `Sales growth: ${(kpis.salesGrowthPct * 100).toFixed(1)}%` },
    { domain: "ecommerce", score: ecomScore, weight: weights.ecommerce, contribution: 0, rationale: `Ecommerce net sales in period: SAR ${ecomSales.toFixed(0)}` },
  ];

  const totalWeight = domains.reduce((a, d) => a + d.weight, 0) || 1;
  let score = 0;
  for (const d of domains) {
    d.contribution = Math.round(((d.score * d.weight) / totalWeight) * 10) / 10;
    score += d.contribution;
  }

  return { score: Math.round(score), domains, period: { from: scope.dateFrom, to: scope.dateTo } };
}
