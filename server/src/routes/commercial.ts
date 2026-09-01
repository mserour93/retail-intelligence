import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { allowedCategoryIds } from "../rbac/users.js";
import { enforceScope, defaultDateFrom, defaultDateTo } from "../rbac/scope.js";
import { computeInventoryKpis, computeKpis, computeTopSellerAvailability } from "../semantic/kpiEngine.js";
import { computePromotionMetrics } from "../engines/promotionAnalytics.js";
import { categories, products, suppliers } from "../data/masters.js";

export const commercialRouter = Router();
commercialRouter.use(authMiddleware);

/** Commercial Command Center (spec §19): category performance, assortment,
 * price, promotion, supplier, inventory. */
commercialRouter.get("/", (req, res) => {
  const user = req.user!;
  const dateFrom = (req.query.from as string) ?? defaultDateFrom();
  const dateTo = (req.query.to as string) ?? defaultDateTo();
  const userCategoryIds = allowedCategoryIds(user);
  const scopeCategories = categories.filter((c) => !userCategoryIds || userCategoryIds.includes(c.id));

  const categoryPerformance = scopeCategories.map((c) => {
    const scope = enforceScope(user, { dateFrom, dateTo, categoryIds: [c.id] });
    const kpis = computeKpis(scope);
    const totalScope = enforceScope(user, { dateFrom, dateTo });
    const total = computeKpis(totalScope);
    return {
      categoryId: c.id,
      categoryName: c.name,
      strategicRole: c.strategicRole,
      netSales: kpis.current.NET_SALES,
      salesGrowthPct: kpis.salesGrowthPct,
      salesVsTargetPct: kpis.current.SALES_VS_TARGET_PCT,
      grossMarginPct: kpis.current.GROSS_MARGIN_PCT,
      marginChangePp: kpis.marginChangePp,
      contributionPct: total.current.NET_SALES ? kpis.current.NET_SALES / total.current.NET_SALES : 0,
    };
  });

  const assortment = scopeCategories.map((c) => {
    const catProducts = products.filter((p) => p.categoryId === c.id);
    const scope = enforceScope(user, { dateFrom, dateTo, categoryIds: [c.id] });
    const availability = computeTopSellerAvailability(scope);
    const topSellerCount = catProducts.filter((p) => p.isTopSeller).length;
    return {
      categoryId: c.id,
      categoryName: c.name,
      skuCount: catProducts.length,
      topSellerSkus: topSellerCount,
      slowMoverCandidateSkus: catProducts.length - topSellerCount,
      avgAvailabilityPct: availability.length ? avg(availability.map((a) => a.current)) : null,
    };
  });

  const price = scopeCategories.flatMap((c) =>
    products
      .filter((p) => p.categoryId === c.id)
      .map((p) => ({ productId: p.id, productName: p.name, categoryName: c.name, price: p.price, isTopSeller: p.isTopSeller })),
  );

  const supplierPerformance = suppliers
    .filter((s) => !userCategoryIds || s.categoryIds.some((cid) => userCategoryIds.includes(cid)))
    .map((s) => {
      const scope = enforceScope(user, { dateFrom, dateTo, categoryIds: s.categoryIds });
      const kpis = computeKpis(scope);
      const inv = computeInventoryKpis(scope);
      return {
        supplierId: s.id,
        supplierName: s.name,
        categoryIds: s.categoryIds,
        netSales: kpis.current.NET_SALES,
        grossMarginPct: kpis.current.GROSS_MARGIN_PCT,
        availabilityPct: inv.AVAILABILITY_PCT,
      };
    });

  const inventoryByCategory = scopeCategories.map((c) => {
    const scope = enforceScope(user, { dateFrom, dateTo, categoryIds: [c.id] });
    const inv = computeInventoryKpis(scope);
    return { categoryId: c.id, categoryName: c.name, ...inv };
  });

  const promotions = computePromotionMetrics().filter((p) => !userCategoryIds || userCategoryIds.includes(p.categoryId));

  res.json({
    period: { from: dateFrom, to: dateTo },
    categoryPerformance,
    assortment,
    price,
    promotions,
    supplierPerformance,
    inventoryByCategory,
    note: "Promotion baseline/uplift/ROI are before/after estimates (avg. daily sales in the 7 days surrounding the promo window), not a controlled experiment. Cannibalization across categories isn't modeled — see docs/ROADMAP.md.",
  });
});

function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
