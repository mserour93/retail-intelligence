import type { ReportDefinition, ReportDefinitionInput } from "./types.js";

/**
 * In-memory Report Definition store. In the target architecture (§35) this
 * is a PostgreSQL table; the interface here (list/get/create/update/remove)
 * is what a Postgres-backed repository would implement, so swapping the
 * storage layer later doesn't change the routes or the AI tool contracts
 * that call it.
 */
const definitions = new Map<string, ReportDefinition>();
let seq = 0;

export function listReports(owner?: string): ReportDefinition[] {
  const all = [...definitions.values()];
  return owner ? all.filter((r) => r.owner === owner) : all;
}

export function getReport(id: string): ReportDefinition | undefined {
  return definitions.get(id);
}

export function createReport(input: ReportDefinitionInput): ReportDefinition {
  seq += 1;
  const now = new Date().toISOString();
  const def: ReportDefinition = {
    ...input,
    id: `report-${seq}`,
    version: 1,
    createdDate: now,
    updatedDate: now,
  };
  definitions.set(def.id, def);
  return def;
}

export function updateReport(id: string, patch: Partial<ReportDefinitionInput>): ReportDefinition | undefined {
  const existing = definitions.get(id);
  if (!existing) return undefined;
  const updated: ReportDefinition = {
    ...existing,
    ...patch,
    version: existing.version + 1,
    updatedDate: new Date().toISOString(),
  };
  definitions.set(id, updated);
  return updated;
}

export function removeReport(id: string): boolean {
  return definitions.delete(id);
}
