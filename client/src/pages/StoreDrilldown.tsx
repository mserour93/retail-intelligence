import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { KpiCard, RedFlagCard, OpportunityCard, SectionHeading, EmptyState, LoadingState, ErrorState } from "../components/shared";
import { ChevronRightIcon } from "../components/icons";
import type { RedFlag, Opportunity } from "../api/types";

interface StoreDrilldownResponse {
  store: { id: string; name: string; code: string; cluster: string; sqm: number };
  period: { from: string; to: string };
  kpis: Record<string, number> & { salesGrowthPct: number; marginChangePp: number; transactionGrowthPct: number };
  inventory: { INVENTORY_VALUE: number; STOCK_DAYS: number; OOS_RATE: number; AVAILABILITY_PCT: number };
  redFlags: RedFlag[];
  opportunities: Opportunity[];
  children: Array<{ categoryId: string; categoryName: string; netSales: number; salesGrowthPct: number; grossMarginPct: number }>;
}

export function StoreDrilldown() {
  const { storeId } = useParams();
  const { data, loading, error } = useApi<StoreDrilldownResponse>(storeId ? `/drilldown/store/${storeId}` : null, [storeId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: data.store.name }]} />
      <h1 className="text-xl font-semibold text-foreground mt-2">{data.store.name}</h1>
      <p className="text-sm text-slate-500">
        {data.store.cluster} · {data.store.sqm} sqm · {data.period.from} to {data.period.to}
      </p>

      <SectionHeading>Store Health</SectionHeading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Net Sales" value={`SAR ${Math.round(data.kpis.NET_SALES).toLocaleString()}`} changePct={data.kpis.salesGrowthPct} changeLabel="vs prior period" />
        <KpiCard label="Sales vs Target" value={`${(data.kpis.SALES_VS_TARGET_PCT * 100).toFixed(1)}%`} />
        <KpiCard label="Transactions" value={data.kpis.TRANSACTIONS.toLocaleString()} changePct={data.kpis.transactionGrowthPct} changeLabel="vs prior period" />
        <KpiCard label="ATV" value={`SAR ${data.kpis.ATV.toFixed(0)}`} />
        <KpiCard label="Gross Margin %" value={`${(data.kpis.GROSS_MARGIN_PCT * 100).toFixed(1)}%`} changePct={data.kpis.marginChangePp} changeLabel="pp vs prior period" />
        <KpiCard label="Inventory Value" value={`SAR ${Math.round(data.inventory.INVENTORY_VALUE).toLocaleString()}`} />
        <KpiCard label="Stock Days" value={data.inventory.STOCK_DAYS.toFixed(0)} />
        <KpiCard label="Availability" value={`${(data.inventory.AVAILABILITY_PCT * 100).toFixed(1)}%`} />
      </div>

      <SectionHeading>Store Red Flags</SectionHeading>
      {data.redFlags.length === 0 ? (
        <EmptyState>No red flags for this store in the selected period.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.redFlags.map((f) => (
            <RedFlagCard key={f.id} flag={f} />
          ))}
        </div>
      )}

      <SectionHeading>Store Opportunities</SectionHeading>
      {data.opportunities.length === 0 ? (
        <EmptyState>No standout opportunities for this store this period.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}

      <SectionHeading>Categories — drill down</SectionHeading>
      <div className="bg-surface border border-border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-muted text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-right px-4 py-2 font-medium">Net Sales</th>
              <th className="text-right px-4 py-2 font-medium">Growth</th>
              <th className="text-right px-4 py-2 font-medium">Margin %</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data.children.map((c) => (
              <tr key={c.categoryId} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-2 font-medium text-foreground">{c.categoryName}</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(c.netSales).toLocaleString()}</td>
                <td className={`px-4 py-2 text-right font-mono ${c.salesGrowthPct < 0 ? "text-destructive" : "text-success"}`}>
                  {(c.salesGrowthPct * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right font-mono">{(c.grossMarginPct * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/category/${c.categoryId}`} className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline">
                    Products <ChevronRightIcon width={14} height={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {item.to ? (
            <Link to={item.to} className="hover:text-primary hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRightIcon width={12} height={12} />}
        </span>
      ))}
    </div>
  );
}
