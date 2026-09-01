import { areas, categories, employeesInStore, products, stores, type Promotion } from "./masters.js";

/**
 * Synthetic data generator. This stands in for the operational + analytical
 * databases (PostgreSQL / ClickHouse in the target architecture, see
 * docs/SPEC.md §35) until real POS/ERP/inventory feeds are connected via the
 * ingestion API stubs in routes/ingestion.ts. Everything downstream (KPI
 * layer, engines, AI tools) reads through this module's exported facts only,
 * so swapping this file for a real database-backed repository is the only
 * change needed to go from mock to live data.
 *
 * Deterministic (seeded PRNG) so the demo tells a consistent story:
 * store-004 (Sahafa Express, Riyadh) is in real decline, store-006
 * (Corniche, Jeddah) has a critical OOS problem, and Riyadh's OTC category
 * has a margin/availability issue — matching the spec's worked examples.
 */

export const DAYS_OF_HISTORY = 60;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260901);

export interface DailyStoreCategoryFact {
  date: string; // ISO yyyy-mm-dd
  storeId: string;
  categoryId: string;
  netSales: number;
  targetSales: number;
  transactions: number;
  unitsSold: number;
  grossProfit: number;
  discountValue: number;
}

export interface InventorySnapshot {
  storeId: string;
  categoryId: string;
  asOfDate: string;
  inventoryValue: number;
  stockDays: number;
  oosRate: number; // 0-1
  availabilityRate: number; // 0-1, 1 - oosRate on tracked SKUs
}

export interface ProductAvailabilityPoint {
  date: string;
  storeId: string;
  productId: string;
  availabilityRate: number;
  stockUnits: number;
}

export interface EcommerceDailyFact {
  date: string;
  netSales: number;
  orders: number;
  sessions: number;
  conversionRate: number;
}

export interface CustomerDailyFact {
  date: string;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  loyaltyPenetrationPct: number;
}

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const CALENDAR: string[] = Array.from({ length: DAYS_OF_HISTORY }, (_, i) =>
  isoDate(DAYS_OF_HISTORY - 1 - i),
).reverse().reverse(); // oldest -> newest already; kept explicit for readability

// Promotion windows, defined by day-index range (inclusive). Applied as a
// sales uplift + extra discount on top of the baseline trend for the
// category, across all stores — a simple, declared-upfront mechanic so the
// promo ROI computed downstream is honest about what "baseline" means
// (the same category's average daily sales just outside this window).
const PROMOTIONS: Array<{ id: string; name: string; categoryId: string; fromDayIndex: number; toDayIndex: number; upliftPct: number; extraDiscountPct: number }> = [
  { id: "promo-beauty-glow", name: "Beauty Glow Week", categoryId: "cat-beauty", fromDayIndex: 20, toDayIndex: 24, upliftPct: 0.32, extraDiscountPct: 0.12 },
  { id: "promo-immunity", name: "Immunity Boost Days", categoryId: "cat-vitamins", fromDayIndex: 37, toDayIndex: 40, upliftPct: 0.22, extraDiscountPct: 0.08 },
];

function activePromotion(categoryId: string, dayIndex: number) {
  return PROMOTIONS.find((p) => p.categoryId === categoryId && dayIndex >= p.fromDayIndex && dayIndex <= p.toDayIndex);
}

// base daily sales per store cluster (SAR)
const CLUSTER_BASE: Record<string, number> = { Flagship: 42000, Standard: 24000, Express: 11000 };
// category share of a store's total sales
const CATEGORY_SHARE: Record<string, number> = {
  "cat-otc": 0.28,
  "cat-rx": 0.24,
  "cat-vitamins": 0.16,
  "cat-beauty": 0.14,
  "cat-personal-care": 0.12,
  "cat-devices": 0.06,
};
const CATEGORY_MARGIN: Record<string, number> = {
  "cat-otc": 0.24,
  "cat-rx": 0.18,
  "cat-vitamins": 0.32,
  "cat-beauty": 0.38,
  "cat-personal-care": 0.3,
  "cat-devices": 0.27,
};
const CATEGORY_AOV: Record<string, number> = {
  "cat-otc": 22,
  "cat-rx": 45,
  "cat-vitamins": 70,
  "cat-beauty": 65,
  "cat-personal-care": 30,
  "cat-devices": 150,
};

// Storylines: multipliers applied on top of the base trend, by store.
const DECLINING_STORE = "store-004"; // Sahafa Express, Riyadh — real, sustained decline
const OOS_STORE = "store-006"; // Corniche, Jeddah — critical OOS
const STRONG_GROWTH_STORE = "store-002"; // Malaz, Riyadh — opportunity story
const RIYADH_OTC_MARGIN_ISSUE_AREA = "area-riyadh";

function dailyTrendMultiplier(storeId: string, dayIndex: number): number {
  const progress = dayIndex / (DAYS_OF_HISTORY - 1); // 0 -> 1 old -> new
  if (storeId === DECLINING_STORE) {
    // -14% cumulative decline concentrated in the last 3 weeks
    return progress < 0.6 ? 1.0 : 1.0 - (progress - 0.6) * 0.35;
  }
  if (storeId === STRONG_GROWTH_STORE) {
    return 1.0 + progress * 0.22;
  }
  return 1.0 + (rand() - 0.5) * 0.03; // small store-level noise, stable trend
}

function categoryMarginMultiplier(storeId: string, categoryId: string, dayIndex: number): number {
  const progress = dayIndex / (DAYS_OF_HISTORY - 1);
  const store = stores.find((s) => s.id === storeId);
  if (categoryId === "cat-otc" && store?.areaId === RIYADH_OTC_MARGIN_ISSUE_AREA && progress > 0.5) {
    return 1 - (progress - 0.5) * 0.14; // margin % erodes ~1.4pp-equivalent in H2
  }
  return 1;
}

export const dailyFacts: DailyStoreCategoryFact[] = [];
export const inventorySnapshots: InventorySnapshot[] = [];
export const productAvailability: ProductAvailabilityPoint[] = [];
export const ecommerceDaily: EcommerceDailyFact[] = [];
export const customerDaily: CustomerDailyFact[] = [];

// Customer metrics are derived from transaction volume, not a separate
// customer-identity dataset — this mock has no CRM/loyalty system feeding
// per-customer transactions, so these are company-wide estimates grounded
// in the same transaction counts as the rest of the model, not free-floating
// random numbers. A real deployment replaces this with actual loyalty data.
const LOYALTY_PENETRATION_PCT = 0.62;
const NEW_CUSTOMER_SHARE = 0.18;

for (let dayIndex = 0; dayIndex < DAYS_OF_HISTORY; dayIndex++) {
  const date = CALENDAR[dayIndex];
  const weekday = new Date(date).getUTCDay();
  const weekendBoost = weekday === 4 || weekday === 5 ? 1.12 : 1.0; // Thu/Fri boost (Saudi weekend)

  let ecomSales = 0;
  let ecomOrders = 0;
  let dayTransactions = 0;

  for (const store of stores) {
    const base = CLUSTER_BASE[store.cluster];
    const trend = dailyTrendMultiplier(store.id, dayIndex);
    const noise = 0.9 + rand() * 0.2;
    const storeTotalSales = base * trend * weekendBoost * noise;

    for (const category of categories) {
      const share = CATEGORY_SHARE[category.id];
      const marginMult = categoryMarginMultiplier(store.id, category.id, dayIndex);
      const catNoise = 0.92 + rand() * 0.16;
      const promo = activePromotion(category.id, dayIndex);
      const promoUpliftMult = promo ? 1 + promo.upliftPct : 1;
      const baseDiscountPct = 0.03 + rand() * 0.04;
      const discountPct = promo ? baseDiscountPct + promo.extraDiscountPct : baseDiscountPct;

      const netSales = Math.round(storeTotalSales * share * catNoise * promoUpliftMult * 100) / 100;
      const targetSales = Math.round(storeTotalSales * share * 1.05 * 100) / 100; // target = 5% above a flat baseline
      const aov = CATEGORY_AOV[category.id];
      const transactions = Math.max(1, Math.round(netSales / aov));
      const unitsSold = Math.max(1, Math.round(transactions * (1.4 + rand() * 0.8)));
      const grossMarginPct = CATEGORY_MARGIN[category.id] * marginMult;
      const grossProfit = Math.round(netSales * grossMarginPct * 100) / 100;
      const discountValue = Math.round(netSales * discountPct * 100) / 100;

      dailyFacts.push({
        date,
        storeId: store.id,
        categoryId: category.id,
        netSales,
        targetSales,
        transactions,
        unitsSold,
        grossProfit,
        discountValue,
      });

      ecomSales += netSales * 0.06; // ecommerce modeled as a small % of retail demand
      ecomOrders += Math.round(transactions * 0.05);
      dayTransactions += transactions;
    }
  }

  const loyaltyTransactions = Math.round(dayTransactions * LOYALTY_PENETRATION_PCT);
  const activeCustomers = Math.round(loyaltyTransactions * 0.97); // small share of members transact twice in a day
  const newCustomers = Math.round(activeCustomers * NEW_CUSTOMER_SHARE);
  customerDaily.push({
    date,
    activeCustomers,
    newCustomers,
    returningCustomers: activeCustomers - newCustomers,
    loyaltyPenetrationPct: LOYALTY_PENETRATION_PCT,
  });

  ecommerceDaily.push({
    date,
    netSales: Math.round(ecomSales * 100) / 100,
    orders: ecomOrders,
    sessions: Math.round(ecomOrders * (8 + rand() * 4)),
    conversionRate: Math.round((ecomOrders / Math.max(1, ecomOrders * (8 + rand() * 4))) * 10000) / 10000,
  });
}

// Inventory snapshots: "30 days ago" and "today" per store x category, to
// support red flags that need a trend (e.g. "availability fell from 96% to 89%").
const snapshotDays = [29, 0];
for (const daysAgo of snapshotDays) {
  const asOfDate = isoDate(daysAgo);
  for (const store of stores) {
    for (const category of categories) {
      let baseAvailability = 0.95 - rand() * 0.04;
      let inventoryValue = 60000 + rand() * 40000;
      let stockDays = 28 + rand() * 14;

      if (store.id === OOS_STORE && daysAgo === 0) {
        baseAvailability = 0.89; // critical OOS today
        stockDays = 12;
      } else if (store.id === OOS_STORE && daysAgo === 29) {
        baseAvailability = 0.97;
      }
      if (
        category.id === "cat-otc" &&
        store.areaId === RIYADH_OTC_MARGIN_ISSUE_AREA &&
        daysAgo === 0
      ) {
        baseAvailability = Math.min(baseAvailability, 0.89);
      }

      inventorySnapshots.push({
        storeId: store.id,
        categoryId: category.id,
        asOfDate,
        inventoryValue: Math.round(inventoryValue * 100) / 100,
        stockDays: Math.round(stockDays * 10) / 10,
        oosRate: Math.round((1 - baseAvailability) * 1000) / 1000,
        availabilityRate: Math.round(baseAvailability * 1000) / 1000,
      });
    }
  }
}

// Top-seller product availability, today and 30 days ago, per store.
const topSellers = products.filter((p) => p.isTopSeller);
for (const daysAgo of snapshotDays) {
  const date = isoDate(daysAgo);
  for (const store of stores) {
    for (const product of topSellers) {
      let availability = 0.94 - rand() * 0.05;
      if (store.id === OOS_STORE && daysAgo === 0) availability = 0.82 - rand() * 0.06;
      if (
        product.categoryId === "cat-otc" &&
        store.areaId === RIYADH_OTC_MARGIN_ISSUE_AREA &&
        daysAgo === 0
      ) {
        availability = Math.min(availability, 0.86);
      }
      productAvailability.push({
        date,
        storeId: store.id,
        productId: product.id,
        availabilityRate: Math.round(availability * 1000) / 1000,
        stockUnits: Math.round(availability * (40 + rand() * 60)),
      });
    }
  }
}

export const promotions: Promotion[] = PROMOTIONS.map((p) => ({
  id: p.id,
  name: p.name,
  categoryId: p.categoryId,
  startDate: CALENDAR[p.fromDayIndex],
  endDate: CALENDAR[p.toDayIndex],
  extraDiscountPct: p.extraDiscountPct,
}));

export interface EmployeeDailyFact {
  date: string;
  employeeId: string;
  storeId: string;
  hoursWorked: number;
  salesAttributed: number;
  transactionsAttributed: number;
}

const STAFF_DAYS_OF_HISTORY = 14;
// Store Manager time is split across admin/ops duties, not all frontline selling.
const ROLE_SALES_WEIGHT: Record<string, number> = { "Store Manager": 0.5, Pharmacist: 1.1, Cashier: 1.0 };

export const employeeDailyFacts: EmployeeDailyFact[] = [];
for (let dayIndex = DAYS_OF_HISTORY - STAFF_DAYS_OF_HISTORY; dayIndex < DAYS_OF_HISTORY; dayIndex++) {
  const date = CALENDAR[dayIndex];
  for (const store of stores) {
    const storeDayFacts = dailyFacts.filter((f) => f.date === date && f.storeId === store.id);
    const storeSales = storeDayFacts.reduce((a, f) => a + f.netSales, 0);
    const storeTransactions = storeDayFacts.reduce((a, f) => a + f.transactions, 0);
    const staff = employeesInStore(store.id);

    const onShiftToday = staff.filter(() => rand() > 0.12); // ~88% attendance
    const totalWeight = onShiftToday.reduce((a, e) => a + (ROLE_SALES_WEIGHT[e.role] ?? 1), 0) || 1;

    for (const emp of staff) {
      const working = onShiftToday.includes(emp);
      const hoursWorked = working ? Math.round((6 + rand() * 3) * 10) / 10 : 0;
      const weight = (ROLE_SALES_WEIGHT[emp.role] ?? 1) / totalWeight;
      const salesAttributed = working ? Math.round(storeSales * weight * 100) / 100 : 0;
      const transactionsAttributed = working ? Math.round(storeTransactions * weight) : 0;
      employeeDailyFacts.push({ date, employeeId: emp.id, storeId: store.id, hoursWorked, salesAttributed, transactionsAttributed });
    }
  }
}

export function latestSnapshotDate(): string {
  return isoDate(0);
}
export function priorSnapshotDate(): string {
  return isoDate(29);
}
export { DECLINING_STORE, OOS_STORE, STRONG_GROWTH_STORE };
