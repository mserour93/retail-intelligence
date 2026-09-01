import { categories, getCategoryById, getStoreById, stores } from "../data/masters.js";
import { computeInventoryKpis, computeKpis, type QueryScope } from "../semantic/kpiEngine.js";

export interface Opportunity {
  id: string;
  entityType: "store" | "category";
  entityId: string;
  entityLabel: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  urgency: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  estimatedValueSar: number | null;
  suggestedConsiderations: string[];
}

let seq = 0;
function nextId() {
  seq += 1;
  return `opp-${seq}`;
}

export function findOpportunities(scope: QueryScope): Opportunity[] {
  seq = 0;
  const opportunities: Opportunity[] = [];
  const scopeStoreIds = scope.storeIds && scope.storeIds.length ? scope.storeIds : stores.map((s) => s.id);
  const scopeCategoryIds = scope.categoryIds && scope.categoryIds.length ? scope.categoryIds : categories.map((c) => c.id);

  for (const storeId of scopeStoreIds) {
    const store = getStoreById(storeId);
    if (!store) continue;
    const storeScope: QueryScope = { ...scope, storeIds: [storeId] };
    const kpis = computeKpis(storeScope);

    // Strong transaction growth but flat/low ATV -> basket-building opportunity
    if (kpis.transactionGrowthPct >= 0.06 && kpis.current.ATV < averageAtv(scopeStoreIds, scope)) {
      opportunities.push({
        id: nextId(),
        entityType: "store",
        entityId: storeId,
        entityLabel: store.name,
        title: "Strong traffic growth, ATV below area average",
        description: `${store.name} grew transactions ${(kpis.transactionGrowthPct * 100).toFixed(1)}% vs the prior period but its average transaction value (SAR ${kpis.current.ATV.toFixed(0)}) trails the scope average.`,
        impact: "medium",
        urgency: "low",
        confidence: "medium",
        estimatedValueSar: round2((averageAtv(scopeStoreIds, scope) - kpis.current.ATV) * kpis.current.TRANSACTIONS),
        suggestedConsiderations: [
          "Review basket-building placement and cross-sell prompts at checkout.",
          "Check whether high-margin add-on categories are visible near the entrance.",
        ],
      });
    }

    // Inventory well above cover -> could support a transfer to a tight-stock store
    const inv = computeInventoryKpis(storeScope);
    if (inv.STOCK_DAYS >= 45 && inv.AVAILABILITY_PCT >= 0.95) {
      opportunities.push({
        id: nextId(),
        entityType: "store",
        entityId: storeId,
        entityLabel: store.name,
        title: "Excess cover available to support nearby stores",
        description: `${store.name} is carrying ${inv.STOCK_DAYS.toFixed(0)} days of stock cover with strong availability (${(inv.AVAILABILITY_PCT * 100).toFixed(0)}%) — a candidate source for transfers to stores facing shortages.`,
        impact: "medium",
        urgency: "low",
        confidence: "medium",
        estimatedValueSar: null,
        suggestedConsiderations: [
          "Compare against nearby stores' OOS red flags for a transfer candidate match.",
          "Confirm with inventory team before committing to a transfer.",
        ],
      });
    }
  }

  for (const categoryId of scopeCategoryIds) {
    const category = getCategoryById(categoryId);
    if (!category) continue;
    const catScope: QueryScope = { ...scope, categoryIds: [categoryId] };
    const kpis = computeKpis(catScope);
    const overallScope: QueryScope = { ...scope, categoryIds: undefined };
    const overall = computeKpis(overallScope);

    if (kpis.salesGrowthPct > overall.salesGrowthPct + 0.04 && kpis.salesGrowthPct > 0) {
      opportunities.push({
        id: nextId(),
        entityType: "category",
        entityId: categoryId,
        entityLabel: category.name,
        title: "Growing faster than the scope average",
        description: `${category.name} is growing ${(kpis.salesGrowthPct * 100).toFixed(1)}% vs a ${(overall.salesGrowthPct * 100).toFixed(1)}% overall average — outperforming its strategic role (${category.strategicRole}).`,
        impact: "medium",
        urgency: "medium",
        confidence: "high",
        estimatedValueSar: round2((kpis.salesGrowthPct - overall.salesGrowthPct) * kpis.current.NET_SALES),
        suggestedConsiderations: [
          "Consider expanding assortment depth or shelf space for this category.",
          "Check whether supply can keep pace with continued growth.",
        ],
      });
    }
  }

  return opportunities.sort((a, b) => rank(b) - rank(a));
}

function rank(o: Opportunity) {
  const w = { high: 3, medium: 2, low: 1 };
  return w[o.impact] + w[o.urgency] + w[o.confidence];
}

function averageAtv(storeIds: string[], scope: QueryScope): number {
  const vals = storeIds.map((id) => computeKpis({ ...scope, storeIds: [id] }).current.ATV).filter((v) => v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
