import { useEffect, useState } from "react";
import { api, downloadFile } from "../api/client";
import { LoadingState, ErrorState, ConfidenceBadge, SectionHeading } from "../components/shared";
import type { KpiDefinition, ReportDefinitionInput, ReportResult } from "../api/types";

const DIMENSIONS: Array<{ value: ReportDefinitionInput["dimensions"][number]; label: string }> = [
  { value: "store", label: "Store" },
  { value: "area", label: "Area" },
  { value: "category", label: "Category" },
  { value: "month", label: "Month" },
  { value: "day", label: "Day" },
];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

export function ReportBuilder() {
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [metrics, setMetrics] = useState<string[]>(["NET_SALES", "GROSS_MARGIN_PCT"]);
  const [dimension, setDimension] = useState<ReportDefinitionInput["dimensions"][number]>("store");
  const [comparison, setComparison] = useState<ReportDefinitionInput["comparison"]>("prior-period");
  const [visualization, setVisualization] = useState<ReportDefinitionInput["visualization"]>("table");
  const [rangeDays, setRangeDays] = useState(30);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ kpis: KpiDefinition[] }>("/reports/kpi-dictionary").then(({ kpis }) => setKpis(kpis));
  }, []);

  function buildInput(): ReportDefinitionInput {
    return {
      name: "Ad-hoc report",
      description: "",
      dataSource: "retail-facts",
      metrics,
      dimensions: [dimension],
      filters: [],
      dateFrom: isoDaysAgo(rangeDays),
      dateTo: isoDaysAgo(0),
      comparison,
      visualization,
    };
  }

  async function runReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<ReportResult>("/reports/preview", buildInput());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run report");
    } finally {
      setLoading(false);
    }
  }

  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  async function exportAs(format: "pdf" | "excel") {
    setExporting(format);
    try {
      await downloadFile(`/reports/preview/export?format=${format}`, buildInput(), format === "pdf" ? "report.pdf" : "report.xlsx");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  const [reportName, setReportName] = useState("My Report");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shareReport() {
    setSharing(true);
    setShareUrl(null);
    setCopied(false);
    try {
      const { report } = await api.post<{ report: { id: string } }>("/reports", { ...buildInput(), name: reportName || "My Report" });
      const { path } = await api.post<{ path: string }>(`/reports/${report.id}/share`);
      setShareUrl(`${window.location.origin}${path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create share link");
    } finally {
      setSharing(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // clipboard permission denied — the link is still selectable/visible
    }
  }

  useEffect(() => {
    runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, dimension, comparison, visualization, rangeDays]);

  function toggleMetric(id: string) {
    setMetrics((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Report Builder</h1>
      <p className="text-sm text-slate-500 mb-4">
        Pick metrics and a dimension — no SQL, no pivot tables. The same Report Definition can render as a table or KPI
        cards, and export to PDF or Excel, stamped with who generated it and when.
      </p>

      <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Metrics</p>
          <div className="flex flex-wrap gap-1.5">
            {kpis.map((k) => (
              <button
                key={k.id}
                onClick={() => toggleMetric(k.id)}
                title={k.definition}
                className={`text-xs px-2.5 py-1.5 rounded-md border cursor-pointer min-h-[36px] ${
                  metrics.includes(k.id) ? "bg-primary text-primary-on border-primary" : "border-border text-slate-600 hover:bg-muted"
                }`}
              >
                {k.nameEn}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Group by (dimension)</p>
            <select value={dimension} onChange={(e) => setDimension(e.target.value as typeof dimension)} className="w-full border border-border rounded-md px-3 py-2 text-sm min-h-[44px]">
              {DIMENSIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Date range</p>
            <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} className="w-full border border-border rounded-md px-3 py-2 text-sm min-h-[44px]">
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Comparison</p>
            <select value={comparison} onChange={(e) => setComparison(e.target.value as typeof comparison)} className="w-full border border-border rounded-md px-3 py-2 text-sm min-h-[44px]">
              <option value="none">None</option>
              <option value="prior-period">Vs prior period</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Presentation</p>
            <select value={visualization} onChange={(e) => setVisualization(e.target.value as typeof visualization)} className="w-full border border-border rounded-md px-3 py-2 text-sm min-h-[44px]">
              <option value="table">Table</option>
              <option value="kpi-cards">KPI Cards</option>
              <option value="ranking">Ranking</option>
            </select>
          </div>
        </div>
      </div>

      <SectionHeading
        action={
          result && (
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence={result.confidence} reason={result.confidenceReason} />
              <button
                onClick={() => exportAs("excel")}
                disabled={exporting !== null}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border text-slate-600 hover:bg-muted cursor-pointer disabled:opacity-50 min-h-[32px]"
              >
                {exporting === "excel" ? "Exporting…" : "Export Excel"}
              </button>
              <button
                onClick={() => exportAs("pdf")}
                disabled={exporting !== null}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border text-slate-600 hover:bg-muted cursor-pointer disabled:opacity-50 min-h-[32px]"
              >
                {exporting === "pdf" ? "Exporting…" : "Export PDF"}
              </button>
            </div>
          )
        }
      >
        Result
      </SectionHeading>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {result && !loading && <ReportOutput result={result} kpis={kpis} />}

      {result && (
        <div className="mt-4 bg-surface border border-border rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Share a secure link</p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Report name"
              className="text-sm border border-border rounded-md px-3 py-2 min-h-[40px] flex-1 min-w-[160px]"
            />
            <button
              onClick={shareReport}
              disabled={sharing}
              className="text-xs font-medium px-3 py-2 rounded-md bg-primary text-primary-on cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {sharing ? "Creating link…" : "Save & Get Link"}
            </button>
          </div>
          {shareUrl && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="text-xs font-mono border border-border rounded-md px-2.5 py-1.5 flex-1 min-w-[200px] bg-muted/40" />
              <button onClick={copyShareUrl} className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border text-slate-600 hover:bg-muted cursor-pointer min-h-[32px]">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5">
            Anyone with this link sees a read-only version — no sign-in needed, scoped to what you're allowed to see.
          </p>
        </div>
      )}
    </div>
  );
}

export function ReportOutput({ result, kpis }: { result: ReportResult; kpis: KpiDefinition[] }) {
  const kpiLabel = (id: string) => kpis.find((k) => k.id === id)?.nameEn ?? id;
  const kpiUnit = (id: string) => kpis.find((k) => k.id === id)?.unit ?? "count";
  const formatValue = (id: string, v: number) => {
    const unit = kpiUnit(id);
    if (unit === "SAR") return `SAR ${Math.round(v).toLocaleString()}`;
    if (unit === "percent") return `${(v * 100).toFixed(1)}%`;
    if (unit === "days") return v.toFixed(0);
    return v.toLocaleString();
  };

  if (result.rows.length === 0) {
    return <p className="text-sm text-slate-500 bg-muted/50 border border-dashed border-border rounded-lg p-4 text-center">No data for this combination.</p>;
  }

  if (result.definition.visualization === "kpi-cards") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {result.definition.metrics.map((m) => (
          <div key={m} className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">{kpiLabel(m)}</p>
            <p className="text-xl font-mono font-semibold text-foreground mt-1">{formatValue(m, result.totals[m])}</p>
          </div>
        ))}
      </div>
    );
  }

  const rows = result.definition.visualization === "ranking" ? [...result.rows].sort((a, b) => (b.metrics[result.definition.metrics[0]] ?? 0) - (a.metrics[result.definition.metrics[0]] ?? 0)) : result.rows;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead className="bg-muted text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2 font-medium">{result.definition.dimensions[0]}</th>
            {result.definition.metrics.map((m) => (
              <th key={m} className="text-right px-4 py-2 font-medium">
                {kpiLabel(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.dimensionValue} className="border-t border-border hover:bg-muted/40">
              <td className="px-4 py-2 font-medium text-foreground">{r.dimensionLabel}</td>
              {result.definition.metrics.map((m) => (
                <td key={m} className="px-4 py-2 text-right font-mono">
                  {formatValue(m, r.metrics[m])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
