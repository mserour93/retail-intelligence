import {
  dailyFacts,
  inventorySnapshots,
  productAvailability,
  latestSnapshotDate,
  priorSnapshotDate,
} from "../data/generate.js";
import { areas, storesInArea, stores } from "../data/masters.js";

export interface QueryScope {
  dateFrom: string; // inclusive, ISO
  dateTo: string; // inclusive, ISO
  storeIds?: string[];
  areaIds?: string[];
  categoryIds?: string[];
}

/** Resolves an area/store scope into a concrete list of store IDs. */
export function resolveStoreIds(scope: QueryScope): string[] {
  if (scope.storeIds && scope.storeIds.length) return scope.storeIds;
  if (scope.areaIds && scope.areaIds.length) {
    return scope.areaIds.flatMap((areaId) => storesInArea(areaId).map((s) => s.id));
  }
  return stores.map((s) => s.id);
}

function inDateRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}

function filterFacts(scope: QueryScope) {
  const storeIds = new Set(resolveStoreIds(scope));
  const categoryIds = scope.categoryIds && scope.categoryIds.length ? new Set(scope.categoryIds) : null;
  return dailyFacts.filter(
    (f) =>
      inDateRange(f.date, scope.dateFrom, scope.dateTo) &&
      storeIds.has(f.storeId) &&
      (!categoryIds || categoryIds.has(f.categoryId)),
  );
}

function priorPeriod(scope: QueryScope): QueryScope {
  const from = new Date(scope.dateFrom);
  const to = new Date(scope.dateTo);
  const lengthDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const priorTo = new Date(from);
  priorTo.setUTCDate(priorTo.getUTCDate() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setUTCDate(priorFrom.getUTCDate() - (lengthDays - 1));
  return {
    ...scope,
    dateFrom: priorFrom.toISOString().slice(0, 10),
    dateTo: priorTo.toISOString().slice(0, 10),
  };
}

export interface KpiSnapshot {
  NET_SALES: number;
  TARGET_SALES: number;
  SALES_VS_TARGET_PCT: number;
  TRANSACTIONS: number;
  UNITS_SOLD: number;
  ATV: number;
  UNITS_PER_TRANSACTION: number;
  GROSS_PROFIT: number;
  GROSS_MARGIN_PCT: number;
  DISCOUNT_VALUE: number;
  DISCOUNT_PCT: number;
}

function summarize(facts: ReturnType<typeof filterFacts>): KpiSnapshot {
  const NET_SALES = round2(sum(facts, (f) => f.netSales));
  const TARGET_SALES = round2(sum(facts, (f) => f.targetSales));
  const TRANSACTIONS = sum(facts, (f) => f.transactions);
  const UNITS_SOLD = sum(facts, (f) => f.unitsSold);
  const GROSS_PROFIT = round2(sum(facts, (f) => f.grossProfit));
  const DISCOUNT_VALUE = round2(sum(facts, (f) => f.discountValue));
  return {
    NET_SALES,
    TARGET_SALES,
    SALES_VS_TARGET_PCT: TARGET_SALES ? round4(NET_SALES / TARGET_SALES - 1) : 0,
    TRANSACTIONS,
    UNITS_SOLD,
    ATV: TRANSACTIONS ? round2(NET_SALES / TRANSACTIONS) : 0,
    UNITS_PER_TRANSACTION: TRANSACTIONS ? round2(UNITS_SOLD / TRANSACTIONS) : 0,
    GROSS_PROFIT,
    GROSS_MARGIN_PCT: NET_SALES ? round4(GROSS_PROFIT / NET_SALES) : 0,
    DISCOUNT_VALUE,
    DISCOUNT_PCT: NET_SALES + DISCOUNT_VALUE ? round4(DISCOUNT_VALUE / (NET_SALES + DISCOUNT_VALUE)) : 0,
  };
}

export interface KpiComparison {
  current: KpiSnapshot;
  prior: KpiSnapshot;
  salesGrowthPct: number;
  transactionGrowthPct: number;
  marginChangePp: number;
}

export function computeKpis(scope: QueryScope): KpiComparison {
  const current = summarize(filterFacts(scope));
  const prior = summarize(filterFacts(priorPeriod(scope)));
  return {
    current,
    prior,
    salesGrowthPct: prior.NET_SALES ? round4(current.NET_SALES / prior.NET_SALES - 1) : 0,
    transactionGrowthPct: prior.TRANSACTIONS ? round4(current.TRANSACTIONS / prior.TRANSACTIONS - 1) : 0,
    marginChangePp: round4(current.GROSS_MARGIN_PCT - prior.GROSS_MARGIN_PCT),
  };
}

export interface InventoryKpis {
  INVENTORY_VALUE: number;
  STOCK_DAYS: number;
  OOS_RATE: number;
  AVAILABILITY_PCT: number;
  priorOosRate: number;
  priorAvailabilityPct: number;
}

export function computeInventoryKpis(scope: QueryScope): InventoryKpis {
  const storeIds = new Set(resolveStoreIds(scope));
  const categoryIds = scope.categoryIds && scope.categoryIds.length ? new Set(scope.categoryIds) : null;
  const latest = latestSnapshotDate();
  const prior = priorSnapshotDate();

  const pick = (asOfDate: string) =>
    inventorySnapshots.filter(
      (s) => s.asOfDate === asOfDate && storeIds.has(s.storeId) && (!categoryIds || categoryIds.has(s.categoryId)),
    );

  const cur = pick(latest);
  const pri = pick(prior);

  const weightedAvg = (rows: typeof cur, field: "stockDays" | "oosRate") => {
    const totalWeight = sum(rows, (r) => r.inventoryValue);
    if (!totalWeight) return 0;
    return round4(sum(rows, (r) => r[field] * r.inventoryValue) / totalWeight);
  };

  const INVENTORY_VALUE = round2(sum(cur, (r) => r.inventoryValue));
  const OOS_RATE = weightedAvg(cur, "oosRate");
  const priorOosRate = weightedAvg(pri, "oosRate");

  return {
    INVENTORY_VALUE,
    STOCK_DAYS: weightedAvg(cur, "stockDays"),
    OOS_RATE,
    AVAILABILITY_PCT: round4(1 - OOS_RATE),
    priorOosRate,
    priorAvailabilityPct: round4(1 - priorOosRate),
  };
}

export interface ProductAvailabilitySummary {
  productId: string;
  storeId: string;
  current: number;
  prior: number;
}

export function computeTopSellerAvailability(scope: QueryScope): ProductAvailabilitySummary[] {
  const storeIds = new Set(resolveStoreIds(scope));
  const latest = latestSnapshotDate();
  const prior = priorSnapshotDate();
  const rows: ProductAvailabilitySummary[] = [];
  for (const p of productAvailability.filter((a) => a.date === latest && storeIds.has(a.storeId))) {
    const priorRow = productAvailability.find(
      (a) => a.date === prior && a.storeId === p.storeId && a.productId === p.productId,
    );
    rows.push({
      productId: p.productId,
      storeId: p.storeId,
      current: p.availabilityRate,
      prior: priorRow?.availabilityRate ?? p.availabilityRate,
    });
  }
  return rows;
}

function sum<T>(rows: T[], f: (r: T) => number): number {
  return rows.reduce((acc, r) => acc + f(r), 0);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function allAreaIds() {
  return areas.map((a) => a.id);
}
