export type Dimension = "store" | "category" | "area" | "month" | "day";
export type Visualization = "table" | "kpi-cards" | "bar" | "line" | "ranking";

export interface ReportFilter {
  field: "store" | "category" | "area";
  op: "in" | "not-in";
  values: string[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  dataSource: "retail-facts";
  metrics: string[]; // KPI dictionary IDs
  dimensions: Dimension[];
  filters: ReportFilter[];
  dateFrom: string;
  dateTo: string;
  comparison: "none" | "prior-period";
  sortBy?: string;
  sortDir?: "asc" | "desc";
  visualization: Visualization;
  owner: string;
  version: number;
  createdDate: string;
  updatedDate: string;
}

export type ReportDefinitionInput = Omit<ReportDefinition, "id" | "version" | "createdDate" | "updatedDate">;
