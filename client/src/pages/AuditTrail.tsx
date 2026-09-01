import { useApi } from "../hooks/useApi";
import { LoadingState, ErrorState, EmptyState } from "../components/shared";

interface AuditEntry {
  id: string;
  eventType: string;
  detail: string;
  timestamp: string;
}

const EVENT_LABELS: Record<string, string> = {
  login: "Signed in",
  control_tower_view: "Viewed Control Tower",
  ai_question: "Asked AI",
  report_export: "Exported report",
  action_recorded: "Recorded decision",
};

export function AuditTrail() {
  const { data, loading, error } = useApi<{ entries: AuditEntry[] }>("/audit");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">My Activity</h1>
      <p className="text-sm text-slate-500 mb-4">
        A record of what you've viewed, asked, exported, and decided — spec §50's audit trail.
      </p>
      {data.entries.length === 0 ? (
        <EmptyState>No activity recorded yet.</EmptyState>
      ) : (
        <div className="space-y-1.5">
          {data.entries.map((e) => (
            <div key={e.id} className="bg-surface border border-border rounded-lg px-4 py-2.5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{EVENT_LABELS[e.eventType] ?? e.eventType}</p>
                <p className="text-xs text-slate-500">{e.detail}</p>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
