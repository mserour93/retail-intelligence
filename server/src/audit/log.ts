/**
 * Audit trail (spec §50): who accessed what, when. In-memory here; in the
 * target architecture this is a PostgreSQL table (§35).
 */
export type AuditEventType =
  | "login"
  | "control_tower_view"
  | "ai_question"
  | "report_view"
  | "report_export"
  | "action_recorded";

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  role: string;
  eventType: AuditEventType;
  detail: string;
  dataScope: string | null;
  timestamp: string;
}

const entries: AuditEntry[] = [];
let seq = 0;

export function recordAudit(input: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  seq += 1;
  const entry: AuditEntry = { ...input, id: `audit-${seq}`, timestamp: new Date().toISOString() };
  entries.push(entry);
  return entry;
}

export function listAudit(userId?: string): AuditEntry[] {
  const all = userId ? entries.filter((e) => e.userId === userId) : entries;
  return [...all].reverse();
}
