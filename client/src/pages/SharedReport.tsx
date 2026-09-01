import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { LoadingState, ErrorState, ConfidenceBadge } from "../components/shared";
import { ReportOutput } from "./ReportBuilder";
import type { KpiDefinition, ReportResult } from "../api/types";

interface SharedResponse {
  result: ReportResult;
  sharedBy: string;
  sharedAt: string;
}

/** Public, unauthenticated view of a shared report (spec §49 secure links). No sign-in required. */
export function SharedReport() {
  const { token } = useParams();
  const [data, setData] = useState<SharedResponse | null>(null);
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.get<SharedResponse>(`/shared/${token}`), api.get<{ kpis: KpiDefinition[] }>("/reports/kpi-dictionary")])
      .then(([shared, dict]) => {
        setData(shared);
        setKpis(dict.kpis);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-md bg-primary text-primary-on flex items-center justify-center font-mono font-semibold">RI</div>
          <div>
            <p className="font-semibold text-foreground">Retail Control Tower — Shared Report</p>
            <p className="text-xs text-slate-500">
              Shared by {data.sharedBy} on {new Date(data.sharedAt).toLocaleDateString()} · Read-only
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-foreground">{data.result.definition.name}</h1>
          <ConfidenceBadge confidence={data.result.confidence} reason={data.result.confidenceReason} />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Period: {data.result.definition.dateFrom} to {data.result.definition.dateTo} · Data as of {data.result.dataAsOf}
        </p>

        <ReportOutput result={data.result} kpis={kpis} />
      </div>
    </div>
  );
}
