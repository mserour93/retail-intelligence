import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { allowedAreaIds, allowedStoreIds } from "../rbac/users.js";
import { enforceScope, defaultDateFrom, defaultDateTo } from "../rbac/scope.js";
import { computeInventoryKpis, computeKpis, type QueryScope } from "../semantic/kpiEngine.js";
import { findRedFlags } from "../engines/redFlagEngine.js";
import { findOpportunities } from "../engines/opportunityEngine.js";
import { computeHealthScore } from "../engines/healthScore.js";
import { recordAudit } from "../audit/log.js";
import { ecommerceDaily, customerDaily } from "../data/generate.js";
import { getAreaById, getStoreById, stores } from "../data/masters.js";

export const controlTowerRouter = Router();
controlTowerRouter.use(authMiddleware);

controlTowerRouter.get("/", (req, res) => {
  const user = req.user!;
  const dateFrom = (req.query.from as string) ?? defaultDateFrom();
  const dateTo = (req.query.to as string) ?? defaultDateTo();
  const scope = enforceScope(user, { dateFrom, dateTo });

  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);
  const health = computeHealthScore(scope);
  const redFlags = findRedFlags(scope);
  const opportunities = findOpportunities(scope);

  recordAudit({
    userId: user.id,
    userName: user.name,
    role: user.role,
    eventType: "control_tower_view",
    detail: `Viewed control tower for ${dateFrom} to ${dateTo}`,
    dataScope: (scope.storeIds ?? []).join(","),
  });

  const areaIds = allowedAreaIds(user);
  const scopeLabel =
    user.role === "STORE_MANAGER"
      ? getStoreById(allowedStoreIds(user)[0])?.name
      : areaIds.length === 1
        ? getAreaById(areaIds[0])?.name
        : "All Areas";

  const whatToLookAtFirst = [...redFlags]
    .sort((a, b) => (b.estimatedImpactSar ?? 0) - (a.estimatedImpactSar ?? 0))
    .slice(0, 3)
    .map((f) => ({ flagId: f.id, entityLabel: f.entityLabel, reason: f.reason, estimatedImpactSar: f.estimatedImpactSar }));

  const takeaways = buildTakeaways(kpis, inv, redFlags.length, opportunities.length);

  const storeRanking =
    user.role === "AREA_MANAGER" || user.role === "RETAIL_DIRECTOR" || user.role === "CEO"
      ? rankStores(scope, allowedStoreIds(user))
      : undefined;

  // Ecommerce is modeled company-wide only in this mock dataset (no per-store
  // attribution), so it's only shown at company-wide scope (CEO/Retail
  // Director) rather than fabricated per area/store — see docs/ROADMAP.md.
  const isCompanyWideScope = user.role === "CEO" || user.role === "RETAIL_DIRECTOR";
  const ecomWindow = ecommerceDaily.filter((e) => e.date >= scope.dateFrom && e.date <= scope.dateTo);
  const ecommerce = isCompanyWideScope
    ? {
        netSales: round2(ecomWindow.reduce((a, e) => a + e.netSales, 0)),
        orders: ecomWindow.reduce((a, e) => a + e.orders, 0),
      }
    : null;

  // Same company-wide-only caveat as ecommerce: derived from total
  // transaction volume, no per-store customer identity in this mock data.
  const custWindow = customerDaily.filter((c) => c.date >= scope.dateFrom && c.date <= scope.dateTo);
  const customer = isCompanyWideScope && custWindow.length
    ? {
        activeCustomers: Math.round(custWindow.reduce((a, c) => a + c.activeCustomers, 0) / custWindow.length),
        newCustomers: custWindow.reduce((a, c) => a + c.newCustomers, 0),
        returningCustomers: custWindow.reduce((a, c) => a + c.returningCustomers, 0),
        loyaltyPenetrationPct: custWindow[0].loyaltyPenetrationPct,
      }
    : null;

  res.json({
    user: { id: user.id, name: user.name, role: user.role },
    greeting: `Good morning, ${user.name.split(" ")[0]} — ${scopeLabel}`,
    scopeLabel,
    period: { from: scope.dateFrom, to: scope.dateTo },
    health,
    kpis: {
      netSales: kpis.current.NET_SALES,
      salesGrowthPct: kpis.salesGrowthPct,
      salesVsTargetPct: kpis.current.SALES_VS_TARGET_PCT,
      transactions: kpis.current.TRANSACTIONS,
      atv: kpis.current.ATV,
      unitsPerTransaction: kpis.current.UNITS_PER_TRANSACTION,
      grossMarginPct: kpis.current.GROSS_MARGIN_PCT,
      marginChangePp: kpis.marginChangePp,
      inventoryValue: inv.INVENTORY_VALUE,
      stockDays: inv.STOCK_DAYS,
      oosRate: inv.OOS_RATE,
      availabilityPct: inv.AVAILABILITY_PCT,
    },
    ecommerce,
    customer,
    redFlags,
    opportunities,
    takeaways,
    whatToLookAtFirst,
    storeRanking,
  });
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildTakeaways(
  kpis: ReturnType<typeof computeKpis>,
  inv: ReturnType<typeof computeInventoryKpis>,
  flagCount: number,
  oppCount: number,
): string[] {
  const items: string[] = [];
  items.push(
    `Sales are ${kpis.salesGrowthPct >= 0 ? "up" : "down"} ${Math.abs(kpis.salesGrowthPct * 100).toFixed(1)}% vs the prior period, ${kpis.current.SALES_VS_TARGET_PCT >= 0 ? "ahead of" : "behind"} target by ${Math.abs(kpis.current.SALES_VS_TARGET_PCT * 100).toFixed(1)}%.`,
  );
  items.push(
    `Margin is ${kpis.marginChangePp >= 0 ? "up" : "down"} ${Math.abs(kpis.marginChangePp * 100).toFixed(1)}pp vs the prior period.`,
  );
  items.push(`Availability is at ${(inv.AVAILABILITY_PCT * 100).toFixed(1)}% across the scope.`);
  items.push(flagCount ? `${flagCount} red flag(s) need attention.` : "No open red flags right now.");
  items.push(oppCount ? `${oppCount} opportunity(ies) worth a look.` : "No standout opportunities this period.");
  return items;
}

function rankStores(scope: QueryScope, storeIds: string[]) {
  return storeIds
    .map((id) => {
      const store = getStoreById(id);
      const storeKpis = computeKpis({ ...scope, storeIds: [id] });
      return {
        storeId: id,
        storeName: store?.name ?? id,
        netSales: storeKpis.current.NET_SALES,
        salesVsTargetPct: storeKpis.current.SALES_VS_TARGET_PCT,
        salesGrowthPct: storeKpis.salesGrowthPct,
      };
    })
    .sort((a, b) => a.salesVsTargetPct - b.salesVsTargetPct);
}

export function allStoreIdsForDebug() {
  return stores.map((s) => s.id);
}
