import { CALENDAR, dailyFacts, promotions } from "../data/generate.js";
import { getCategoryById } from "../data/masters.js";

/**
 * Promotion performance (spec §19/§21/§27). Baseline is estimated as the
 * category's average daily sales in the 7 days immediately before and after
 * the promo window — a simple before/after estimate, not a controlled
 * experiment, so it's labeled as an estimate rather than presented as exact.
 */
export interface PromotionMetrics {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  promoDays: number;
  promoSales: number;
  baselineDailySales: number;
  baselineSalesEstimate: number;
  incrementalSalesEstimate: number;
  upliftPctEstimate: number;
  discountCost: number;
  incrementalMarginEstimate: number;
  roiEstimate: number | null;
}

export function computePromotionMetrics(): PromotionMetrics[] {
  return promotions.map((promo) => {
    const promoDates = CALENDAR.filter((d) => d >= promo.startDate && d <= promo.endDate);
    const promoRows = dailyFacts.filter((f) => f.categoryId === promo.categoryId && promoDates.includes(f.date));
    const promoSales = round2(promoRows.reduce((a, f) => a + f.netSales, 0));
    const promoGrossProfit = promoRows.reduce((a, f) => a + f.grossProfit, 0);
    const promoMarginRate = promoSales ? promoGrossProfit / promoSales : 0;

    const startIdx = CALENDAR.indexOf(promo.startDate);
    const endIdx = CALENDAR.indexOf(promo.endDate);
    const beforeDates = CALENDAR.slice(Math.max(0, startIdx - 7), startIdx);
    const afterDates = CALENDAR.slice(endIdx + 1, Math.min(CALENDAR.length, endIdx + 8));
    const baselineDates = [...beforeDates, ...afterDates];
    const baselineRows = dailyFacts.filter((f) => f.categoryId === promo.categoryId && baselineDates.includes(f.date));
    const baselineDailySales = baselineDates.length
      ? round2(baselineRows.reduce((a, f) => a + f.netSales, 0) / baselineDates.length)
      : 0;

    const baselineSalesEstimate = round2(baselineDailySales * promoDates.length);
    const incrementalSalesEstimate = round2(promoSales - baselineSalesEstimate);
    const upliftPctEstimate = baselineSalesEstimate ? round4(incrementalSalesEstimate / baselineSalesEstimate) : 0;

    // Discount cost attributable to the promotion: the extra discount rate applied to promo-period sales.
    const discountCost = round2(promo.extraDiscountPct * promoSales);
    const incrementalMarginEstimate = round2(incrementalSalesEstimate * promoMarginRate - discountCost);
    const roiEstimate = discountCost ? round4(incrementalMarginEstimate / discountCost) : null;

    return {
      id: promo.id,
      name: promo.name,
      categoryId: promo.categoryId,
      categoryName: getCategoryById(promo.categoryId)?.name ?? promo.categoryId,
      startDate: promo.startDate,
      endDate: promo.endDate,
      promoDays: promoDates.length,
      promoSales,
      baselineDailySales,
      baselineSalesEstimate,
      incrementalSalesEstimate,
      upliftPctEstimate,
      discountCost,
      incrementalMarginEstimate,
      roiEstimate,
    };
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
