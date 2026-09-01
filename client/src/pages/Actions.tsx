import { useApi } from "../hooks/useApi";
import { LoadingState, ErrorState, EmptyState } from "../components/shared";
import type { ManagementAction } from "../api/types";
import { api } from "../api/client";
import { useState } from "react";

const DECISION_LABELS: Record<string, string> = {
  investigate: "Investigating",
  contact_store: "Contacting the store",
  discuss_category: "Discussing with category team",
  review_pricing: "Reviewing pricing",
  review_inventory: "Reviewing inventory",
  monitor: "Monitoring",
  not_relevant: "Not relevant",
  already_handled: "Already handled",
};

export function Actions() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useApi<{ actions: ManagementAction[] }>("/actions", [refreshKey]);

  async function toggleStatus(action: ManagementAction) {
    await api.patch(`/actions/${action.id}/status`, { status: action.status === "open" ? "resolved" : "open" });
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">My Management Actions</h1>
      <p className="text-sm text-slate-500 mb-4">
        Decisions you've recorded against red flags and opportunities. This is internal tracking only — nothing here
        changes any business system (POS, ERP, pricing, inventory).
      </p>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && data.actions.length === 0 && <EmptyState>You haven't recorded any decisions yet. Open a red flag and tap "Record a decision".</EmptyState>}
      {data && data.actions.length > 0 && (
        <div className="space-y-2">
          {data.actions
            .slice()
            .reverse()
            .map((a) => (
              <div key={a.id} className="bg-surface border border-border rounded-lg p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.status === "open" ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}`}>
                      {a.status}
                    </span>
                    <span className="text-sm font-medium text-foreground">{DECISION_LABELS[a.decision] ?? a.decision}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {a.refType === "red_flag" ? "Red flag" : "Opportunity"} · {new Date(a.createdDate).toLocaleString()}
                  </p>
                  {a.note && <p className="text-sm text-slate-700 mt-1">{a.note}</p>}
                </div>
                <button onClick={() => toggleStatus(a)} className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap">
                  Mark {a.status === "open" ? "resolved" : "open"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
