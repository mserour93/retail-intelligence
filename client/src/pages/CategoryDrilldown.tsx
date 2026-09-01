import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { KpiCard, RedFlagCard, OpportunityCard, SectionHeading, EmptyState, LoadingState, ErrorState } from "../components/shared";
import { Breadcrumb } from "./StoreDrilldown";
import type { RedFlag, Opportunity } from "../api/types";

interface CategoryDrilldownResponse {
  category: { id: string; name: string; strategicRole: string };
  period: { from: string; to: string };
  kpis: Record<string, number> & { salesGrowthPct: number; marginChangePp: number };
  inventory: { INVENTORY_VALUE: number; STOCK_DAYS: number; OOS_RATE: number; AVAILABILITY_PCT: number };
  redFlags: RedFlag[];
  opportunities: Opportunity[];
  children: Array<{ productId: string; productName: string; sku: string; brand: string; price: number; availabilityPct: number | null }>;
}

export function CategoryDrilldown() {
  const { categoryId } = useParams();
  const { data, loading, error } = useApi<CategoryDrilldownResponse>(categoryId ? `/drilldown/category/${categoryId}` : null, [categoryId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: data.category.name }]} />
      <h1 className="text-xl font-semibold text-foreground mt-2">{data.category.name}</h1>
      <p className="text-sm text-slate-500">
        Strategic role: <span className="font-medium text-foreground">{data.category.strategicRole}</span> · {data.period.from} to {data.period.to}
      </p>

      <SectionHeading>Category Summary</SectionHeading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Net Sales" value={`SAR ${Math.round(data.kpis.NET_SALES).toLocaleString()}`} changePct={data.kpis.salesGrowthPct} changeLabel="vs prior period" />
        <KpiCard label="Sales vs Target" value={`${(data.kpis.SALES_VS_TARGET_PCT * 100).toFixed(1)}%`} />
        <KpiCard label="Gross Margin %" value={`${(data.kpis.GROSS_MARGIN_PCT * 100).toFixed(1)}%`} changePct={data.kpis.marginChangePp} changeLabel="pp vs prior period" />
        <KpiCard label="Availability" value={`${(data.inventory.AVAILABILITY_PCT * 100).toFixed(1)}%`} />
        <KpiCard label="Stock Turn Days" value={data.inventory.STOCK_DAYS.toFixed(0)} />
        <KpiCard label="Inventory Value" value={`SAR ${Math.round(data.inventory.INVENTORY_VALUE).toLocaleString()}`} />
      </div>

      <SectionHeading>Red Flags</SectionHeading>
      {data.redFlags.length === 0 ? (
        <EmptyState>No red flags for this category in the selected period.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.redFlags.map((f) => (
            <RedFlagCard key={f.id} flag={f} />
          ))}
        </div>
      )}

      <SectionHeading>Opportunities</SectionHeading>
      {data.opportunities.length === 0 ? (
        <EmptyState>No standout opportunities this period.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}

      <SectionHeading>Products — drill down</SectionHeading>
      <div className="bg-surface border border-border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-muted text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Product</th>
              <th className="text-left px-4 py-2 font-medium">Brand</th>
              <th className="text-right px-4 py-2 font-medium">Price</th>
              <th className="text-right px-4 py-2 font-medium">Availability</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data.children.map((p) => (
              <tr key={p.productId} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-2 font-medium text-foreground">{p.productName}</td>
                <td className="px-4 py-2 text-slate-500">{p.brand}</td>
                <td className="px-4 py-2 text-right font-mono">SAR {p.price.toFixed(2)}</td>
                <td className={`px-4 py-2 text-right font-mono ${p.availabilityPct !== null && p.availabilityPct < 0.9 ? "text-destructive" : ""}`}>
                  {p.availabilityPct !== null ? `${(p.availabilityPct * 100).toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/product/${p.productId}`} className="text-xs text-primary hover:underline">
                    Details
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
