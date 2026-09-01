/**
 * Certified KPI dictionary (docs/SPEC.md §33-34). Every number surfaced by
 * the API — control tower, reports, AI answers — is computed by
 * `kpiEngine.ts` from one of these certified definitions. Nothing downstream
 * invents its own formula; a new ad-hoc calculation must be added here first
 * (or, per the spec, flagged as a "custom calculation" distinct from a
 * certified KPI — see `ai/customMetric.ts`).
 */

export type KpiUnit = "SAR" | "count" | "percent" | "days" | "ratio";

export interface KpiDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  definition: string;
  formula: string;
  grain: "store-category-day";
  unit: KpiUnit;
  owner: string;
  version: string;
  status: "certified";
}

export const KPI_DICTIONARY: Record<string, KpiDefinition> = {
  NET_SALES: {
    id: "NET_SALES",
    nameEn: "Net Sales",
    nameAr: "صافي المبيعات",
    definition: "Net retail sales after discounts, for the selected scope and period.",
    formula: "SUM(netSales)",
    grain: "store-category-day",
    unit: "SAR",
    owner: "Finance",
    version: "1.0",
    status: "certified",
  },
  TARGET_SALES: {
    id: "TARGET_SALES",
    nameEn: "Sales Target",
    nameAr: "مستهدف المبيعات",
    definition: "Budgeted / target net sales for the selected scope and period.",
    formula: "SUM(targetSales)",
    grain: "store-category-day",
    unit: "SAR",
    owner: "Retail Planning",
    version: "1.0",
    status: "certified",
  },
  SALES_VS_TARGET_PCT: {
    id: "SALES_VS_TARGET_PCT",
    nameEn: "Sales vs Target",
    nameAr: "المبيعات مقابل المستهدف",
    definition: "Net sales achievement against target.",
    formula: "NET_SALES / TARGET_SALES - 1",
    grain: "store-category-day",
    unit: "percent",
    owner: "Retail Planning",
    version: "1.0",
    status: "certified",
  },
  SALES_GROWTH_PCT: {
    id: "SALES_GROWTH_PCT",
    nameEn: "Sales Growth (vs Prior Period)",
    nameAr: "نمو المبيعات (مقابل الفترة السابقة)",
    definition:
      "Net sales growth versus the immediately preceding period of equal length. Note: this dataset holds 60 days of history, not a full prior year, so this is a prior-period comparison, not true like-for-like vs last year — the AI and UI must label it as such rather than calling it LFL.",
    formula: "NET_SALES[period] / NET_SALES[priorPeriod] - 1",
    grain: "store-category-day",
    unit: "percent",
    owner: "Finance",
    version: "1.0",
    status: "certified",
  },
  TRANSACTIONS: {
    id: "TRANSACTIONS",
    nameEn: "Transactions",
    nameAr: "عدد المعاملات",
    definition: "Count of sales transactions in the selected scope and period.",
    formula: "SUM(transactions)",
    grain: "store-category-day",
    unit: "count",
    owner: "Retail Operations",
    version: "1.0",
    status: "certified",
  },
  TRANSACTION_GROWTH_PCT: {
    id: "TRANSACTION_GROWTH_PCT",
    nameEn: "Transaction Growth",
    nameAr: "نمو المعاملات",
    definition: "Transaction count growth versus the immediately preceding period.",
    formula: "TRANSACTIONS[period] / TRANSACTIONS[priorPeriod] - 1",
    grain: "store-category-day",
    unit: "percent",
    owner: "Retail Operations",
    version: "1.0",
    status: "certified",
  },
  ATV: {
    id: "ATV",
    nameEn: "Average Transaction Value",
    nameAr: "متوسط قيمة المعاملة",
    definition: "Average value per transaction.",
    formula: "NET_SALES / TRANSACTIONS",
    grain: "store-category-day",
    unit: "SAR",
    owner: "Retail Operations",
    version: "1.0",
    status: "certified",
  },
  UNITS_PER_TRANSACTION: {
    id: "UNITS_PER_TRANSACTION",
    nameEn: "Units per Transaction",
    nameAr: "الوحدات لكل معاملة",
    definition: "Average number of units sold per transaction.",
    formula: "SUM(unitsSold) / TRANSACTIONS",
    grain: "store-category-day",
    unit: "ratio",
    owner: "Retail Operations",
    version: "1.0",
    status: "certified",
  },
  GROSS_PROFIT: {
    id: "GROSS_PROFIT",
    nameEn: "Gross Profit",
    nameAr: "إجمالي الربح",
    definition: "Net sales less cost of goods sold, for the selected scope and period.",
    formula: "SUM(grossProfit)",
    grain: "store-category-day",
    unit: "SAR",
    owner: "Finance",
    version: "1.0",
    status: "certified",
  },
  GROSS_MARGIN_PCT: {
    id: "GROSS_MARGIN_PCT",
    nameEn: "Gross Margin %",
    nameAr: "هامش الربح الإجمالي",
    definition: "Gross profit as a percentage of net sales.",
    formula: "GROSS_PROFIT / NET_SALES",
    grain: "store-category-day",
    unit: "percent",
    owner: "Finance",
    version: "1.0",
    status: "certified",
  },
  MARGIN_CHANGE_PP: {
    id: "MARGIN_CHANGE_PP",
    nameEn: "Margin Change (pp)",
    nameAr: "تغير الهامش (نقطة مئوية)",
    definition: "Change in gross margin percentage versus the immediately preceding period, in percentage points.",
    formula: "GROSS_MARGIN_PCT[period] - GROSS_MARGIN_PCT[priorPeriod]",
    grain: "store-category-day",
    unit: "percent",
    owner: "Finance",
    version: "1.0",
    status: "certified",
  },
  DISCOUNT_PCT: {
    id: "DISCOUNT_PCT",
    nameEn: "Discount %",
    nameAr: "نسبة الخصم",
    definition: "Discount value as a percentage of gross sales (net sales + discount).",
    formula: "SUM(discountValue) / (NET_SALES + SUM(discountValue))",
    grain: "store-category-day",
    unit: "percent",
    owner: "Commercial",
    version: "1.0",
    status: "certified",
  },
  INVENTORY_VALUE: {
    id: "INVENTORY_VALUE",
    nameEn: "Inventory Value",
    nameAr: "قيمة المخزون",
    definition: "Cost value of on-hand inventory as of the latest snapshot in scope.",
    formula: "SUM(inventoryValue) as of latest snapshot",
    grain: "store-category-day",
    unit: "SAR",
    owner: "Inventory",
    version: "1.0",
    status: "certified",
  },
  STOCK_DAYS: {
    id: "STOCK_DAYS",
    nameEn: "Inventory Days",
    nameAr: "أيام المخزون",
    definition: "Weighted-average days of stock cover as of the latest snapshot in scope.",
    formula: "WEIGHTED_AVG(stockDays, by inventoryValue)",
    grain: "store-category-day",
    unit: "days",
    owner: "Inventory",
    version: "1.0",
    status: "certified",
  },
  OOS_RATE: {
    id: "OOS_RATE",
    nameEn: "Out-of-Stock Rate",
    nameAr: "نسبة نفاد المخزون",
    definition: "Share of tracked SKUs currently out of stock, as of the latest snapshot in scope.",
    formula: "WEIGHTED_AVG(oosRate, by inventoryValue)",
    grain: "store-category-day",
    unit: "percent",
    owner: "Inventory",
    version: "1.0",
    status: "certified",
  },
  AVAILABILITY_PCT: {
    id: "AVAILABILITY_PCT",
    nameEn: "Availability %",
    nameAr: "نسبة التوافر",
    definition: "Share of tracked SKUs in stock, as of the latest snapshot in scope.",
    formula: "1 - OOS_RATE",
    grain: "store-category-day",
    unit: "percent",
    owner: "Inventory",
    version: "1.0",
    status: "certified",
  },
};

export function getKpiDefinition(id: string): KpiDefinition | undefined {
  return KPI_DICTIONARY[id];
}

export function listKpiDefinitions(): KpiDefinition[] {
  return Object.values(KPI_DICTIONARY);
}
