import { categories, getCategoryById, getStoreById, stores } from "../data/masters.js";
import {
  computeInventoryKpis,
  computeKpis,
  computeTopSellerAvailability,
  type QueryScope,
} from "../semantic/kpiEngine.js";

export type Severity = "critical" | "high" | "medium";

export interface RedFlag {
  id: string;
  severity: Severity;
  entityType: "store" | "category" | "area" | "product";
  entityId: string;
  entityLabel: string;
  kpiId: string;
  kpiLabel: string;
  currentValue: number;
  expectedValue: number;
  variance: number;
  threshold: number;
  period: { from: string; to: string };
  reason: string;
  estimatedImpactSar: number | null;
  owner: string | null;
  status: "open";
  createdDate: string;
  suggestedConsiderations: string[];
}

const TODAY = new Date().toISOString().slice(0, 10);

let seq = 0;
function nextId() {
  seq += 1;
  return `flag-${seq}`;
}

/** Resets the ID counter; call at the start of each engine run so IDs are stable per request. */
function resetIds() {
  seq = 0;
}

const THRESHOLDS = {
  salesVsTargetPct: -0.1,
  salesGrowthPct: -0.08,
  transactionGrowthPct: -0.07,
  marginChangePp: -0.01,
  availabilityPct: 0.9,
  availabilityDropPp: -0.05,
  stockDaysExcess: 60,
};

export function findRedFlags(scope: QueryScope): RedFlag[] {
  resetIds();
  const flags: RedFlag[] = [];
  const scopeStoreIds = scope.storeIds && scope.storeIds.length ? scope.storeIds : stores.map((s) => s.id);
  const scopeCategoryIds = scope.categoryIds && scope.categoryIds.length ? scope.categoryIds : categories.map((c) => c.id);

  // Store-level: sales vs target, sales decline, transaction decline
  for (const storeId of scopeStoreIds) {
    const store = getStoreById(storeId);
    if (!store) continue;
    const storeScope: QueryScope = { ...scope, storeIds: [storeId] };
    const kpis = computeKpis(storeScope);

    if (kpis.current.SALES_VS_TARGET_PCT <= THRESHOLDS.salesVsTargetPct) {
      flags.push({
        id: nextId(),
        severity: kpis.current.SALES_VS_TARGET_PCT <= -0.15 ? "critical" : "high",
        entityType: "store",
        entityId: storeId,
        entityLabel: store.name,
        kpiId: "SALES_VS_TARGET_PCT",
        kpiLabel: "Sales vs Target",
        currentValue: kpis.current.SALES_VS_TARGET_PCT,
        expectedValue: 0,
        variance: kpis.current.SALES_VS_TARGET_PCT,
        threshold: THRESHOLDS.salesVsTargetPct,
        period: { from: scope.dateFrom, to: scope.dateTo },
        reason: `${store.name} is ${Math.abs(kpis.current.SALES_VS_TARGET_PCT * 100).toFixed(1)}% below its sales target for the period.`,
        estimatedImpactSar: round2(kpis.current.TARGET_SALES - kpis.current.NET_SALES),
        owner: store.managerUserId,
        status: "open",
        createdDate: TODAY,
        suggestedConsiderations: [
          "Review the store's category mix against the area average.",
          "Check availability of top-selling SKUs at this store.",
          "Discuss with the Store Manager on local demand or execution issues.",
        ],
      });
    }

    if (kpis.salesGrowthPct <= THRESHOLDS.salesGrowthPct) {
      flags.push({
        id: nextId(),
        severity: kpis.salesGrowthPct <= -0.14 ? "critical" : "high",
        entityType: "store",
        entityId: storeId,
        entityLabel: store.name,
        kpiId: "SALES_GROWTH_PCT",
        kpiLabel: "Sales Growth (vs Prior Period)",
        currentValue: kpis.salesGrowthPct,
        expectedValue: 0,
        variance: kpis.salesGrowthPct,
        threshold: THRESHOLDS.salesGrowthPct,
        period: { from: scope.dateFrom, to: scope.dateTo },
        reason: `${store.name} sales are down ${Math.abs(kpis.salesGrowthPct * 100).toFixed(1)}% vs the prior period, mainly driven by transactions (${(kpis.transactionGrowthPct * 100).toFixed(1)}%).`,
        estimatedImpactSar: round2(kpis.prior.NET_SALES - kpis.current.NET_SALES),
        owner: store.managerUserId,
        status: "open",
        createdDate: TODAY,
        suggestedConsiderations: [
          "Review recent replenishment and availability trends for this store.",
          "Check whether a nearby store can support transfers.",
          "Review local competitive or seasonal demand factors.",
        ],
      });
    } else if (kpis.transactionGrowthPct <= THRESHOLDS.transactionGrowthPct) {
      flags.push({
        id: nextId(),
        severity: "medium",
        entityType: "store",
        entityId: storeId,
        entityLabel: store.name,
        kpiId: "TRANSACTION_GROWTH_PCT",
        kpiLabel: "Transaction Growth",
        currentValue: kpis.transactionGrowthPct,
        expectedValue: 0,
        variance: kpis.transactionGrowthPct,
        threshold: THRESHOLDS.transactionGrowthPct,
        period: { from: scope.dateFrom, to: scope.dateTo },
        reason: `${store.name} has an abnormal transaction decline of ${Math.abs(kpis.transactionGrowthPct * 100).toFixed(1)}% vs the prior period.`,
        estimatedImpactSar: null,
        owner: store.managerUserId,
        status: "open",
        createdDate: TODAY,
        suggestedConsiderations: [
          "Check footfall drivers: local events, weather, nearby competitor activity.",
          "Review staffing levels against typical traffic patterns.",
        ],
      });
    }

    // Store-level availability
    const inv = computeInventoryKpis(storeScope);
    if (inv.AVAILABILITY_PCT <= THRESHOLDS.availabilityPct || inv.AVAILABILITY_PCT - inv.priorAvailabilityPct <= THRESHOLDS.availabilityDropPp) {
      flags.push({
        id: nextId(),
        severity: inv.AVAILABILITY_PCT <= 0.85 ? "critical" : "high",
        entityType: "store",
        entityId: storeId,
        entityLabel: store.name,
        kpiId: "AVAILABILITY_PCT",
        kpiLabel: "Availability %",
        currentValue: inv.AVAILABILITY_PCT,
        expectedValue: inv.priorAvailabilityPct,
        variance: round4(inv.AVAILABILITY_PCT - inv.priorAvailabilityPct),
        threshold: THRESHOLDS.availabilityPct,
        period: { from: scope.dateFrom, to: scope.dateTo },
        reason: `${store.name} availability fell from ${(inv.priorAvailabilityPct * 100).toFixed(0)}% to ${(inv.AVAILABILITY_PCT * 100).toFixed(0)}% (OOS rate ${(inv.OOS_RATE * 100).toFixed(1)}%).`,
        estimatedImpactSar: round2(inv.OOS_RATE * kpis.current.NET_SALES * 0.3),
        owner: store.managerUserId,
        status: "open",
        createdDate: TODAY,
        suggestedConsiderations: [
          "Review OOS of top-selling SKUs at this store.",
          "Check recent replenishment parameters and lead times.",
          "Review nearby store inventory that could support a transfer.",
        ],
      });
    }
  }

  // Category-level: margin deterioration, category contribution to area decline
  for (const categoryId of scopeCategoryIds) {
    const category = getCategoryById(categoryId);
    if (!category) continue;
    const catScope: QueryScope = { ...scope, categoryIds: [categoryId] };
    const kpis = computeKpis(catScope);

    if (kpis.marginChangePp <= THRESHOLDS.marginChangePp) {
      flags.push({
        id: nextId(),
        severity: kpis.marginChangePp <= -0.02 ? "high" : "medium",
        entityType: "category",
        entityId: categoryId,
        entityLabel: category.name,
        kpiId: "MARGIN_CHANGE_PP",
        kpiLabel: "Margin Change (pp)",
        currentValue: kpis.current.GROSS_MARGIN_PCT,
        expectedValue: kpis.prior.GROSS_MARGIN_PCT,
        variance: kpis.marginChangePp,
        threshold: THRESHOLDS.marginChangePp,
        period: { from: scope.dateFrom, to: scope.dateTo },
        reason: `${category.name} margin declined ${Math.abs(kpis.marginChangePp * 100).toFixed(1)}pp vs the prior period (${(kpis.prior.GROSS_MARGIN_PCT * 100).toFixed(1)}% -> ${(kpis.current.GROSS_MARGIN_PCT * 100).toFixed(1)}%). Strategic role: ${category.strategicRole} — weigh this against the category's intended role before acting.`,
        estimatedImpactSar: round2(Math.abs(kpis.marginChangePp) * kpis.current.NET_SALES),
        owner: null,
        status: "open",
        createdDate: TODAY,
        suggestedConsiderations: [
          "Check whether recent promotions or discounting are eroding margin.",
          "Review supplier cost changes for this category.",
          "Confirm this isn't expected given the category's strategic role.",
        ],
      });
    }
  }

  // Product-level: top-seller availability drop
  const availability = computeTopSellerAvailability(scope);
  const criticalDrops = availability.filter((a) => a.current <= 0.85 || a.current - a.prior <= -0.08);
  if (criticalDrops.length >= 3) {
    flags.push({
      id: nextId(),
      severity: "high",
      entityType: "product",
      entityId: "top-sellers",
      entityLabel: "Critical top-seller SKUs",
      kpiId: "AVAILABILITY_PCT",
      kpiLabel: "Availability %",
      currentValue: round4(avg(criticalDrops.map((c) => c.current))),
      expectedValue: round4(avg(criticalDrops.map((c) => c.prior))),
      variance: round4(avg(criticalDrops.map((c) => c.current - c.prior))),
      threshold: 0.85,
      period: { from: scope.dateFrom, to: scope.dateTo },
      reason: `${criticalDrops.length} top-selling SKUs are below the availability threshold across the selected scope.`,
      estimatedImpactSar: null,
      owner: null,
      status: "open",
      createdDate: TODAY,
      suggestedConsiderations: [
        "Prioritize replenishment for the affected top-seller SKUs.",
        "Check whether a common supplier is behind the shortfall.",
      ],
    });
  }

  return flags.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || (b.estimatedImpactSar ?? 0) - (a.estimatedImpactSar ?? 0));
}

function severityRank(s: Severity) {
  return s === "critical" ? 3 : s === "high" ? 2 : 1;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
