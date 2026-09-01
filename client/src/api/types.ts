export type Role =
  | "CEO"
  | "RETAIL_DIRECTOR"
  | "AREA_MANAGER"
  | "STORE_MANAGER"
  | "COMMERCIAL_DIRECTOR"
  | "CATEGORY_MANAGER";

export interface Persona {
  id: string;
  name: string;
  role: Role;
  areaIds?: string[];
  storeIds?: string[];
}

export interface RedFlag {
  id: string;
  severity: "critical" | "high" | "medium";
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

export interface DomainScore {
  domain: string;
  score: number;
  weight: number;
  contribution: number;
  rationale: string;
}

export interface RetailHealthScore {
  score: number;
  domains: DomainScore[];
  period: { from: string; to: string };
}

export interface ControlTowerKpis {
  netSales: number;
  salesGrowthPct: number;
  salesVsTargetPct: number;
  transactions: number;
  atv: number;
  unitsPerTransaction: number;
  grossMarginPct: number;
  marginChangePp: number;
  inventoryValue: number;
  stockDays: number;
  oosRate: number;
  availabilityPct: number;
}

export interface StoreRankingRow {
  storeId: string;
  storeName: string;
  netSales: number;
  salesVsTargetPct: number;
  salesGrowthPct: number;
}

export interface ControlTowerResponse {
  user: { id: string; name: string; role: Role };
  greeting: string;
  scopeLabel: string;
  period: { from: string; to: string };
  health: RetailHealthScore;
  kpis: ControlTowerKpis;
  redFlags: RedFlag[];
  opportunities: Opportunity[];
  takeaways: string[];
  whatToLookAtFirst: Array<{ flagId: string; entityLabel: string; reason: string; estimatedImpactSar: number | null }>;
  storeRanking?: StoreRankingRow[];
  ecommerce: { netSales: number; orders: number } | null;
}

export interface AiAnswer {
  executiveAnswer: string;
  keyNumbers: Array<{ label: string; value: string }>;
  whatHappened: string;
  why: string;
  redFlags: RedFlag[];
  opportunities: Opportunity[];
  suggestedConsiderations: string[];
  takeaways: string[];
  dataContext: {
    period: { from: string; to: string };
    filters: string;
    dataAsOf: string;
    dataSource: string;
    confidence: "high" | "medium" | "low";
    confidenceReason: string;
  };
}

export interface KpiDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  definition: string;
  formula: string;
  grain: string;
  unit: string;
  owner: string;
  version: string;
  status: string;
}

export interface DataSourceStatus {
  sourceId: string;
  sourceName: string;
  status: "healthy" | "stale" | "error";
  latestRefresh: string;
  expectedRefresh: string;
  recordCount: number;
  rejectedRecords: number;
  duplicates: number;
  note: string;
}

export interface ManagementAction {
  id: string;
  refType: "red_flag" | "opportunity";
  refId: string;
  decision: string;
  note: string;
  ownerUserId: string;
  status: "open" | "resolved";
  createdDate: string;
}

export interface CommercialCategoryRow {
  categoryId: string;
  categoryName: string;
  strategicRole: string;
  netSales: number;
  salesGrowthPct: number;
  salesVsTargetPct: number;
  grossMarginPct: number;
  marginChangePp: number;
  contributionPct: number;
}

export interface CommercialResponse {
  period: { from: string; to: string };
  categoryPerformance: CommercialCategoryRow[];
  assortment: Array<{ categoryId: string; categoryName: string; skuCount: number; topSellerSkus: number; slowMoverCandidateSkus: number; avgAvailabilityPct: number | null }>;
  price: Array<{ productId: string; productName: string; categoryName: string; price: number; isTopSeller: boolean }>;
  supplierPerformance: Array<{ supplierId: string; supplierName: string; categoryIds: string[]; netSales: number; grossMarginPct: number; availabilityPct: number }>;
  inventoryByCategory: Array<{ categoryId: string; categoryName: string; INVENTORY_VALUE: number; STOCK_DAYS: number; OOS_RATE: number; AVAILABILITY_PCT: number }>;
  note: string;
}

export interface ReportDefinitionInput {
  name: string;
  description: string;
  dataSource: "retail-facts";
  metrics: string[];
  dimensions: Array<"store" | "category" | "area" | "month" | "day">;
  filters: Array<{ field: "store" | "category" | "area"; op: "in" | "not-in"; values: string[] }>;
  dateFrom: string;
  dateTo: string;
  comparison: "none" | "prior-period";
  visualization: "table" | "kpi-cards" | "bar" | "line" | "ranking";
  owner?: string;
}

export interface ReportRow {
  dimensionValue: string;
  dimensionLabel: string;
  metrics: Record<string, number>;
  priorMetrics?: Record<string, number>;
}

export interface ReportResult {
  definition: ReportDefinitionInput & { id: string };
  rows: ReportRow[];
  totals: Record<string, number>;
  dataAsOf: string;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
}
