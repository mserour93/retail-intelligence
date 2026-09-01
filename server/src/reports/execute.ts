import { areas, categories, getAreaById, getCategoryById, getStoreById, storesInArea, stores } from "../data/masters.js";
import { computeInventoryKpis, computeKpis, type QueryScope } from "../semantic/kpiEngine.js";
import { getKpiDefinition } from "../semantic/kpiDictionary.js";
import type { Dimension, ReportDefinition } from "./types.js";

const INVENTORY_KPI_IDS = new Set(["INVENTORY_VALUE", "STOCK_DAYS", "OOS_RATE", "AVAILABILITY_PCT"]);

export interface ReportRow {
  dimensionValue: string;
  dimensionLabel: string;
  metrics: Record<string, number>;
  priorMetrics?: Record<string, number>;
}

export interface ReportResult {
  definition: ReportDefinition;
  rows: ReportRow[];
  totals: Record<string, number>;
  dataAsOf: string;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
}

function baseScope(def: ReportDefinition, allowedStoreIds: Set<string>): QueryScope {
  let storeIds = [...allowedStoreIds];
  for (const f of def.filters) {
    if (f.field === "store") {
      const set = new Set(f.values);
      storeIds = f.op === "in" ? storeIds.filter((id) => set.has(id)) : storeIds.filter((id) => !set.has(id));
    }
    if (f.field === "area") {
      const areaStoreIds = new Set(f.values.flatMap((a) => storesInArea(a).map((s) => s.id)));
      storeIds = f.op === "in" ? storeIds.filter((id) => areaStoreIds.has(id)) : storeIds.filter((id) => !areaStoreIds.has(id));
    }
  }
  const categoryFilter = def.filters.find((f) => f.field === "category");
  return {
    dateFrom: def.dateFrom,
    dateTo: def.dateTo,
    storeIds,
    categoryIds: categoryFilter
      ? categoryFilter.op === "in"
        ? categoryFilter.values
        : categories.map((c) => c.id).filter((id) => !categoryFilter.values.includes(id))
      : undefined,
  };
}

function dimensionBuckets(def: ReportDefinition, dim: Dimension, scope: QueryScope): Array<{ value: string; label: string; scope: QueryScope }> {
  switch (dim) {
    case "store":
      return (scope.storeIds ?? []).map((id) => ({ value: id, label: getStoreById(id)?.name ?? id, scope: { ...scope, storeIds: [id] } }));
    case "area": {
      const areaIds = [...new Set((scope.storeIds ?? []).map((id) => getStoreById(id)?.areaId).filter(Boolean))] as string[];
      return areaIds.map((id) => ({
        value: id,
        label: getAreaById(id)?.name ?? id,
        scope: { ...scope, storeIds: storesInArea(id).filter((s) => scope.storeIds?.includes(s.id)).map((s) => s.id) },
      }));
    }
    case "category": {
      const catIds = scope.categoryIds && scope.categoryIds.length ? scope.categoryIds : categories.map((c) => c.id);
      return catIds.map((id) => ({ value: id, label: getCategoryById(id)?.name ?? id, scope: { ...scope, categoryIds: [id] } }));
    }
    case "month":
    case "day":
      return dateBuckets(def.dateFrom, def.dateTo, dim).map((b) => ({ value: b.key, label: b.label, scope: { ...scope, dateFrom: b.from, dateTo: b.to } }));
    default:
      return [];
  }
}

function dateBuckets(from: string, to: string, dim: "month" | "day") {
  const buckets: Array<{ key: string; label: string; from: string; to: string }> = [];
  if (dim === "day") {
    let d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
      const iso = d.toISOString().slice(0, 10);
      buckets.push({ key: iso, label: iso, from: iso, to: iso });
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return buckets;
  }
  const seen = new Map<string, { from: string; to: string }>();
  let d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const iso = d.toISOString().slice(0, 10);
    const existing = seen.get(key);
    seen.set(key, { from: existing?.from ?? iso, to: iso });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  for (const [key, range] of seen) {
    buckets.push({ key, label: key, from: range.from, to: range.to });
  }
  return buckets;
}

function metricsFor(scope: QueryScope, metricIds: string[]): Record<string, number> {
  const flow = computeKpis(scope);
  const inv = INVENTORY_KPI_IDS.size && metricIds.some((m) => INVENTORY_KPI_IDS.has(m)) ? computeInventoryKpis(scope) : null;
  const out: Record<string, number> = {};
  for (const id of metricIds) {
    if (id === "SALES_GROWTH_PCT") out[id] = scope.dateFrom ? metricsGrowth(scope) : 0;
    else if (id === "TRANSACTION_GROWTH_PCT") out[id] = flow.transactionGrowthPct;
    else if (id === "MARGIN_CHANGE_PP") out[id] = flow.marginChangePp;
    else if (id in flow.current) out[id] = (flow.current as unknown as Record<string, number>)[id];
    else if (inv && id in inv) out[id] = (inv as unknown as Record<string, number>)[id];
    else out[id] = 0;
  }
  return out;
}

function metricsGrowth(scope: QueryScope): number {
  return computeKpis(scope).salesGrowthPct;
}

export function executeReport(def: ReportDefinition, allowedStoreIds: Set<string>): ReportResult {
  const scope = baseScope(def, allowedStoreIds);
  const dim = def.dimensions[0] ?? "store";
  const buckets = dimensionBuckets(def, dim, scope);

  const rows: ReportRow[] = buckets.map((b) => {
    const metrics = metricsFor(b.scope, def.metrics);
    const priorMetrics =
      def.comparison === "prior-period" ? metricsFor(shiftPeriod(b.scope), def.metrics) : undefined;
    return { dimensionValue: b.value, dimensionLabel: b.label, metrics, priorMetrics };
  });

  if (def.sortBy) {
    const key = def.sortBy;
    rows.sort((a, b) => ((a.metrics[key] ?? 0) - (b.metrics[key] ?? 0)) * (def.sortDir === "desc" ? -1 : 1));
  }

  const totals: Record<string, number> = {};
  for (const id of def.metrics) {
    const def2 = getKpiDefinition(id);
    if (def2 && (def2.unit === "SAR" || def2.unit === "count")) {
      totals[id] = round2(rows.reduce((a, r) => a + (r.metrics[id] ?? 0), 0));
    } else {
      totals[id] = rows.length ? round4(rows.reduce((a, r) => a + (r.metrics[id] ?? 0), 0) / rows.length) : 0;
    }
  }

  const rowCount = rows.length;
  const confidence: ReportResult["confidence"] = rowCount === 0 ? "low" : rowCount < 3 ? "medium" : "high";
  const confidenceReason =
    rowCount === 0
      ? "No rows matched the selected scope and filters."
      : rowCount < 3
        ? "Small sample size for this scope; interpret with caution."
        : "Certified KPI definitions, complete synthetic dataset for the selected period.";

  return { definition: def, rows, totals, dataAsOf: new Date().toISOString(), confidence, confidenceReason };
}

function shiftPeriod(scope: QueryScope): QueryScope {
  const from = new Date(scope.dateFrom);
  const to = new Date(scope.dateTo);
  const lengthDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const priorTo = new Date(from);
  priorTo.setUTCDate(priorTo.getUTCDate() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setUTCDate(priorFrom.getUTCDate() - (lengthDays - 1));
  return { ...scope, dateFrom: priorFrom.toISOString().slice(0, 10), dateTo: priorTo.toISOString().slice(0, 10) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function allStoreIds() {
  return stores.map((s) => s.id);
}
export function allAreaIds() {
  return areas.map((a) => a.id);
}
