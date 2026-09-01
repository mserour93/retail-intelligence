import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { KpiCard, RedFlagCard, OpportunityCard, SectionHeading, EmptyState, LoadingState, ErrorState } from "../components/shared";
import { DecisionModal } from "../components/DecisionModal";
import type { ControlTowerResponse, RedFlag } from "../api/types";
import { useAuth } from "../context/AuthContext";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "21 days", days: 21 },
];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

export function ControlTower() {
  const { currentUser } = useAuth();
  const [rangeDays, setRangeDays] = useState(14);
  const [decisionTarget, setDecisionTarget] = useState<RedFlag | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const from = isoDaysAgo(rangeDays);
  const path = `/control-tower?from=${from}`;
  const { data, loading, error } = useApi<ControlTowerResponse>(path, [rangeDays, refreshKey]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const isExecutive = currentUser?.role === "CEO" || currentUser?.role === "RETAIL_DIRECTOR";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{data.greeting}</h1>
          <p className="text-sm text-slate-500">
            {data.period.from} to {data.period.to}
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`text-xs px-2.5 py-1.5 rounded cursor-pointer min-h-[32px] ${
                rangeDays === r.days ? "bg-surface shadow-sm text-primary font-medium" : "text-slate-500"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <HealthScoreCard health={data.health} />

      <SectionHeading>{isExecutive ? "Executive Summary" : "Executive Summary"}</SectionHeading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Net Sales" value={`SAR ${Math.round(data.kpis.netSales).toLocaleString()}`} changePct={data.kpis.salesGrowthPct} changeLabel="vs prior period" />
        <KpiCard label="Sales vs Target" value={`${(data.kpis.salesVsTargetPct * 100).toFixed(1)}%`} />
        <KpiCard label="Transactions" value={data.kpis.transactions.toLocaleString()} />
        <KpiCard label="ATV" value={`SAR ${data.kpis.atv.toFixed(0)}`} />
        <KpiCard label="Gross Margin %" value={`${(data.kpis.grossMarginPct * 100).toFixed(1)}%`} changePct={data.kpis.marginChangePp} changeLabel="pp vs prior period" />
        <KpiCard label="Units / Transaction" value={data.kpis.unitsPerTransaction.toFixed(2)} />
        <KpiCard label="Inventory Value" value={`SAR ${Math.round(data.kpis.inventoryValue).toLocaleString()}`} />
        <KpiCard label="Availability" value={`${(data.kpis.availabilityPct * 100).toFixed(1)}%`} positiveIsGood />
      </div>

      {data.whatToLookAtFirst.length > 0 && (
        <>
          <SectionHeading>What should I look at first?</SectionHeading>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            {data.whatToLookAtFirst.map((item, i) => (
              <div key={item.flagId} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-on text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{item.entityLabel}</span> — {item.reason}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionHeading>Red Flags</SectionHeading>
      {data.redFlags.length === 0 ? (
        <EmptyState>No open red flags in this scope for the selected period.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.redFlags.map((f) => (
            <RedFlagCard key={f.id} flag={f} onDecide={setDecisionTarget} />
          ))}
        </div>
      )}

      <SectionHeading>Opportunities</SectionHeading>
      {data.opportunities.length === 0 ? (
        <EmptyState>No standout opportunities detected this period.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}

      <SectionHeading>Management Takeaways</SectionHeading>
      <ul className="bg-surface border border-border rounded-lg p-4 space-y-1.5 text-sm text-slate-700 list-disc pl-8">
        {data.takeaways.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      {data.storeRanking && (
        <>
          <SectionHeading>Store Ranking (by vs Target)</SectionHeading>
          <div className="bg-surface border border-border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-muted text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Store</th>
                  <th className="text-right px-4 py-2 font-medium">Net Sales</th>
                  <th className="text-right px-4 py-2 font-medium">vs Target</th>
                  <th className="text-right px-4 py-2 font-medium">Growth</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.storeRanking.map((s) => (
                  <tr key={s.storeId} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2 font-medium text-foreground">{s.storeName}</td>
                    <td className="px-4 py-2 text-right font-mono">{Math.round(s.netSales).toLocaleString()}</td>
                    <td className={`px-4 py-2 text-right font-mono ${s.salesVsTargetPct < 0 ? "text-destructive" : "text-success"}`}>
                      {(s.salesVsTargetPct * 100).toFixed(1)}%
                    </td>
                    <td className={`px-4 py-2 text-right font-mono ${s.salesGrowthPct < 0 ? "text-destructive" : "text-success"}`}>
                      {(s.salesGrowthPct * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/store/${s.storeId}`} className="text-xs text-primary hover:underline">
                        Drill down
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {decisionTarget && (
        <DecisionModal
          target={{ type: "red_flag", item: decisionTarget }}
          onClose={() => setDecisionTarget(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function HealthScoreCard({ health }: { health: ControlTowerResponse["health"] }) {
  const color = health.score >= 75 ? "text-success" : health.score >= 55 ? "text-accent" : "text-destructive";
  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-mono font-bold ${color}`}>{health.score}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">Retail Health Score</p>
          <p className="text-xs text-slate-500">out of 100 · weighted across domains</p>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {health.domains.map((d) => (
          <div key={d.domain} title={d.rationale} className="text-center">
            <p className="text-xs font-mono text-slate-600">{d.score}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate">{d.domain}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
