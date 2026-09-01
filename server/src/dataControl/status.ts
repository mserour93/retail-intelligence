import { dailyFacts, ecommerceDaily, inventorySnapshots, latestSnapshotDate } from "../data/generate.js";
import { ingestionLog } from "../ingestion/log.js";

export interface SourceStatus {
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

/**
 * Data Control Center (spec §32). The mock generator stands in for the
 * "source" here (sales/inventory/ecommerce), plus the live ingestion log
 * from the POST /api/v1/* stub endpoints. A real deployment reports actual
 * POS/ERP/ecommerce connector health here instead.
 */
export function getDataControlStatus(): SourceStatus[] {
  const latest = latestSnapshotDate();
  const salesRows = dailyFacts.filter((f) => f.date === latest);
  const ecomRows = ecommerceDaily.filter((e) => e.date === latest);
  const invRows = inventorySnapshots.filter((s) => s.asOfDate === latest);

  const ingestionByEndpoint = new Map<string, { count: number; rejected: number }>();
  for (const entry of ingestionLog) {
    const bucket = ingestionByEndpoint.get(entry.endpoint) ?? { count: 0, rejected: 0 };
    bucket.count += 1;
    if (entry.status === "rejected") bucket.rejected += 1;
    ingestionByEndpoint.set(entry.endpoint, bucket);
  }

  return [
    {
      sourceId: "src-pos-sales",
      sourceName: "POS Sales (mock)",
      status: salesRows.length ? "healthy" : "stale",
      latestRefresh: latest,
      expectedRefresh: "daily, by 06:00 local",
      recordCount: salesRows.length,
      rejectedRecords: 0,
      duplicates: 0,
      note: "Synthetic dataset — no live POS connection in this environment.",
    },
    {
      sourceId: "src-inventory",
      sourceName: "Inventory Snapshot (mock)",
      status: invRows.length ? "healthy" : "stale",
      latestRefresh: latest,
      expectedRefresh: "daily, by 07:00 local",
      recordCount: invRows.length,
      rejectedRecords: 0,
      duplicates: 0,
      note: "Synthetic dataset — no live ERP/inventory connection in this environment.",
    },
    {
      sourceId: "src-ecommerce",
      sourceName: "Ecommerce Orders (mock)",
      status: ecomRows.length ? "healthy" : "stale",
      latestRefresh: latest,
      expectedRefresh: "hourly",
      recordCount: ecomRows.length,
      rejectedRecords: 0,
      duplicates: 0,
      note: "Synthetic dataset — no live ecommerce platform connection in this environment.",
    },
    {
      sourceId: "src-ingestion-api",
      sourceName: "Ingestion API (POST /api/v1/*)",
      status: "healthy",
      latestRefresh: ingestionLog.at(-1)?.receivedAt ?? "never",
      expectedRefresh: "on submit",
      recordCount: ingestionLog.filter((e) => e.status === "accepted").length,
      rejectedRecords: ingestionLog.filter((e) => e.status === "rejected").length,
      duplicates: ingestionLog.filter((e) => e.status === "duplicate").length,
      note: "Accepted payloads are validated and logged; they do not currently feed the control-tower engines (see docs/ROADMAP.md).",
    },
  ];
}
