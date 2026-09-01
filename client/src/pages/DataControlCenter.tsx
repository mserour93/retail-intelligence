import { useApi } from "../hooks/useApi";
import { LoadingState, ErrorState } from "../components/shared";
import type { DataSourceStatus } from "../api/types";

export function DataControlCenter() {
  const { data, loading, error } = useApi<{ sources: DataSourceStatus[] }>("/data-control-center");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Data Control Center</h1>
      <p className="text-sm text-slate-500 mb-4">
        Data-quality and freshness status the AI checks before answering (spec §32). If a source is stale, the AI states
        that explicitly rather than answering from stale data.
      </p>

      <div className="space-y-3">
        {data.sources.map((s) => (
          <div key={s.sourceId} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold text-foreground">{s.sourceName}</p>
              <StatusBadge status={s.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
              <Stat label="Latest Refresh" value={s.latestRefresh} />
              <Stat label="Expected" value={s.expectedRefresh} />
              <Stat label="Records" value={s.recordCount.toLocaleString()} />
              <Stat label="Rejected / Duplicate" value={`${s.rejectedRecords} / ${s.duplicates}`} />
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">{s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 uppercase text-[10px]">{label}</p>
      <p className="font-mono text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DataSourceStatus["status"] }) {
  const styles = { healthy: "bg-success/10 text-success", stale: "bg-accent/10 text-accent", error: "bg-destructive/10 text-destructive" };
  return <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
}
