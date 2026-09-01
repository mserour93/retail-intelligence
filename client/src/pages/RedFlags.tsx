import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { RedFlagCard, LoadingState, ErrorState, EmptyState, SectionHeading } from "../components/shared";
import { DecisionModal } from "../components/DecisionModal";
import type { RedFlag } from "../api/types";

interface ControlTowerLite {
  redFlags: RedFlag[];
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

export function RedFlags() {
  const [rangeDays, setRangeDays] = useState(14);
  const [target, setTarget] = useState<RedFlag | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useApi<ControlTowerLite>(`/control-tower?from=${isoDaysAgo(rangeDays)}`, [rangeDays, refreshKey]);

  const bySeverity = { critical: 0, high: 0, medium: 0 };
  data?.redFlags.forEach((f) => bySeverity[f.severity]++);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-foreground">Red Flags</h1>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {[7, 14, 21].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`text-xs px-2.5 py-1.5 rounded cursor-pointer min-h-[32px] ${rangeDays === d ? "bg-surface shadow-sm text-primary font-medium" : "text-slate-500"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <div className="flex gap-3 mt-3 mb-2 text-sm">
            <span className="text-destructive font-medium">{bySeverity.critical} critical</span>
            <span className="text-accent font-medium">{bySeverity.high} high</span>
            <span className="text-secondary font-medium">{bySeverity.medium} medium</span>
          </div>
          <SectionHeading>All open red flags</SectionHeading>
          {data.redFlags.length === 0 ? (
            <EmptyState>No open red flags in your scope for this period.</EmptyState>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {data.redFlags.map((f) => (
                <RedFlagCard key={f.id} flag={f} onDecide={setTarget} />
              ))}
            </div>
          )}
        </>
      )}

      {target && (
        <DecisionModal target={{ type: "red_flag", item: target }} onClose={() => setTarget(null)} onSaved={() => setRefreshKey((k) => k + 1)} />
      )}
    </div>
  );
}
