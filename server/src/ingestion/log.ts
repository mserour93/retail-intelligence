export interface IngestionLogEntry {
  id: string;
  endpoint: string;
  status: "accepted" | "rejected" | "duplicate";
  idempotencyKey?: string;
  recordCount: number;
  errors?: string[];
  receivedAt: string;
}

export const ingestionLog: IngestionLogEntry[] = [];
const seenIdempotencyKeys = new Set<string>();
let seq = 0;

export function logIngestion(
  endpoint: string,
  recordCount: number,
  idempotencyKey?: string,
  errors?: string[],
): IngestionLogEntry {
  seq += 1;
  let status: IngestionLogEntry["status"] = errors && errors.length ? "rejected" : "accepted";
  if (idempotencyKey && seenIdempotencyKeys.has(idempotencyKey)) {
    status = "duplicate";
  } else if (idempotencyKey) {
    seenIdempotencyKeys.add(idempotencyKey);
  }
  const entry: IngestionLogEntry = {
    id: `ingest-${seq}`,
    endpoint,
    status,
    idempotencyKey,
    recordCount,
    errors,
    receivedAt: new Date().toISOString(),
  };
  ingestionLog.push(entry);
  return entry;
}
