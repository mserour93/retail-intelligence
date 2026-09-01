import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { canAccessArea, canAccessStore } from "../rbac/users.js";
import { enforceScope, defaultDateFrom, defaultDateTo } from "../rbac/scope.js";
import { computeInventoryKpis, computeKpis, computeTopSellerAvailability } from "../semantic/kpiEngine.js";
import { findRedFlags } from "../engines/redFlagEngine.js";
import { findOpportunities } from "../engines/opportunityEngine.js";
import { staffSummary } from "../engines/staffAnalytics.js";
import { categories, getAreaById, getCategoryById, getProductById, getStoreById, productsInCategory, storesInArea } from "../data/masters.js";

export const drilldownRouter = Router();
drilldownRouter.use(authMiddleware);

function periodFromQuery(req: import("express").Request) {
  return {
    dateFrom: (req.query.from as string) ?? defaultDateFrom(),
    dateTo: (req.query.to as string) ?? defaultDateTo(),
  };
}

drilldownRouter.get("/area/:areaId", (req, res) => {
  const user = req.user!;
  const { areaId } = req.params;
  const area = getAreaById(areaId);
  if (!area) return res.status(404).json({ error: "Area not found" });
  if (!canAccessArea(user, areaId)) return res.status(403).json({ error: "Not permitted to view this area" });

  const scope = enforceScope(user, { ...periodFromQuery(req), areaIds: [areaId] });
  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);
  const storeSummaries = storesInArea(areaId).map((s) => {
    const sKpis = computeKpis({ ...scope, storeIds: [s.id] });
    return { storeId: s.id, storeName: s.name, netSales: sKpis.current.NET_SALES, salesVsTargetPct: sKpis.current.SALES_VS_TARGET_PCT, salesGrowthPct: sKpis.salesGrowthPct };
  });

  res.json({
    area,
    period: { from: scope.dateFrom, to: scope.dateTo },
    kpis: { ...kpis.current, salesGrowthPct: kpis.salesGrowthPct, marginChangePp: kpis.marginChangePp, transactionGrowthPct: kpis.transactionGrowthPct },
    inventory: inv,
    redFlags: findRedFlags(scope),
    opportunities: findOpportunities(scope),
    children: storeSummaries,
  });
});

drilldownRouter.get("/store/:storeId", (req, res) => {
  const user = req.user!;
  const { storeId } = req.params;
  const store = getStoreById(storeId);
  if (!store) return res.status(404).json({ error: "Store not found" });
  if (!canAccessStore(user, storeId)) return res.status(403).json({ error: "Not permitted to view this store" });

  const scope = enforceScope(user, { ...periodFromQuery(req), storeIds: [storeId] });
  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);
  const categorySummaries = categories.map((c) => {
    const cKpis = computeKpis({ ...scope, categoryIds: [c.id] });
    return { categoryId: c.id, categoryName: c.name, netSales: cKpis.current.NET_SALES, salesGrowthPct: cKpis.salesGrowthPct, grossMarginPct: cKpis.current.GROSS_MARGIN_PCT };
  });

  res.json({
    store,
    period: { from: scope.dateFrom, to: scope.dateTo },
    kpis: { ...kpis.current, salesGrowthPct: kpis.salesGrowthPct, marginChangePp: kpis.marginChangePp, transactionGrowthPct: kpis.transactionGrowthPct },
    inventory: inv,
    redFlags: findRedFlags(scope),
    opportunities: findOpportunities(scope),
    children: categorySummaries,
  });
});

drilldownRouter.get("/store/:storeId/staff", (req, res) => {
  const user = req.user!;
  const { storeId } = req.params;
  const store = getStoreById(storeId);
  if (!store) return res.status(404).json({ error: "Store not found" });
  if (!canAccessStore(user, storeId)) return res.status(403).json({ error: "Not permitted to view this store" });

  const { dateFrom, dateTo } = periodFromQuery(req);
  const staff = staffSummary(storeId, dateFrom, dateTo);

  res.json({
    store,
    period: { from: dateFrom, to: dateTo },
    staff,
    note: "Compare staff by sales/hour, not total sales — totals reflect hours worked and shift, not just performance. Store Managers carry admin/ops duties alongside frontline selling.",
  });
});

drilldownRouter.get("/category/:categoryId", (req, res) => {
  const user = req.user!;
  const { categoryId } = req.params;
  const category = getCategoryById(categoryId);
  if (!category) return res.status(404).json({ error: "Category not found" });

  const scope = enforceScope(user, { ...periodFromQuery(req), categoryIds: [categoryId] });
  const kpis = computeKpis(scope);
  const inv = computeInventoryKpis(scope);
  const availability = computeTopSellerAvailability(scope);
  const productSummaries = productsInCategory(categoryId).map((p) => {
    const avail = availability.filter((a) => a.productId === p.id);
    const avgAvail = avail.length ? avail.reduce((a, b) => a + b.current, 0) / avail.length : null;
    return { productId: p.id, productName: p.name, sku: p.sku, brand: p.brand, price: p.price, availabilityPct: avgAvail };
  });

  res.json({
    category,
    period: { from: scope.dateFrom, to: scope.dateTo },
    kpis: { ...kpis.current, salesGrowthPct: kpis.salesGrowthPct, marginChangePp: kpis.marginChangePp },
    inventory: inv,
    redFlags: findRedFlags(scope),
    opportunities: findOpportunities(scope),
    children: productSummaries,
  });
});

drilldownRouter.get("/product/:productId", (req, res) => {
  const user = req.user!;
  const { productId } = req.params;
  const product = getProductById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const scope = enforceScope(user, { ...periodFromQuery(req), categoryIds: [product.categoryId] });
  const availability = computeTopSellerAvailability(scope).filter((a) => a.productId === productId);
  const avgAvail = availability.length ? availability.reduce((a, b) => a + b.current, 0) / availability.length : null;
  const priorAvail = availability.length ? availability.reduce((a, b) => a + b.prior, 0) / availability.length : null;

  res.json({
    product,
    category: getCategoryById(product.categoryId),
    period: { from: scope.dateFrom, to: scope.dateTo },
    availabilityPct: avgAvail,
    priorAvailabilityPct: priorAvail,
    isTopSeller: product.isTopSeller,
    note: avgAvail === null ? "Availability tracked only for top-seller SKUs in this mock dataset." : undefined,
  });
});
