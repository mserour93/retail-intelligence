import { useApi } from "../hooks/useApi";
import { SectionHeading, LoadingState, ErrorState } from "../components/shared";
import type { CommercialResponse } from "../api/types";

export function CommercialCommandCenter() {
  const { data, loading, error } = useApi<CommercialResponse>("/commercial");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Commercial Command Center</h1>
      <p className="text-sm text-slate-500">
        {data.period.from} to {data.period.to}
      </p>

      <SectionHeading>Category Performance</SectionHeading>
      <Table
        columns={["Category", "Role", "Net Sales", "Growth", "vs Target", "Margin %", "Margin Δpp", "Contribution"]}
        rows={data.categoryPerformance.map((c) => [
          c.categoryName,
          c.strategicRole,
          `SAR ${Math.round(c.netSales).toLocaleString()}`,
          pct(c.salesGrowthPct),
          pct(c.salesVsTargetPct),
          pct(c.grossMarginPct),
          pctPoint(c.marginChangePp),
          pct(c.contributionPct),
        ])}
      />

      <SectionHeading>Assortment</SectionHeading>
      <Table
        columns={["Category", "SKU Count", "Top Sellers", "Slow-Mover Candidates", "Avg Availability"]}
        rows={data.assortment.map((a) => [a.categoryName, a.skuCount, a.topSellerSkus, a.slowMoverCandidateSkus, a.avgAvailabilityPct !== null ? pct(a.avgAvailabilityPct) : "—"])}
      />

      <SectionHeading>Price</SectionHeading>
      <Table
        columns={["Product", "Category", "Price", "Top Seller"]}
        rows={data.price.map((p) => [p.productName, p.categoryName, `SAR ${p.price.toFixed(2)}`, p.isTopSeller ? "Yes" : ""])}
      />

      <SectionHeading>Supplier Performance</SectionHeading>
      <Table
        columns={["Supplier", "Categories", "Net Sales", "Margin %", "Availability"]}
        rows={data.supplierPerformance.map((s) => [s.supplierName, s.categoryIds.length, `SAR ${Math.round(s.netSales).toLocaleString()}`, pct(s.grossMarginPct), pct(s.availabilityPct)])}
      />

      <SectionHeading>Inventory by Category</SectionHeading>
      <Table
        columns={["Category", "Inventory Value", "Stock Days", "OOS Rate", "Availability"]}
        rows={data.inventoryByCategory.map((i) => [i.categoryName, `SAR ${Math.round(i.INVENTORY_VALUE).toLocaleString()}`, i.STOCK_DAYS.toFixed(0), pct(i.OOS_RATE), pct(i.AVAILABILITY_PCT)])}
      />

      <p className="text-xs text-slate-400 mt-6 italic">{data.note}</p>
    </div>
  );
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function pctPoint(n: number) {
  return `${(n * 100).toFixed(1)}pp`;
}

function Table({ columns, rows }: { columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead className="bg-muted text-slate-500 text-xs uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c} className={`px-4 py-2 font-medium ${c === columns[0] ? "text-left" : "text-right"}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border hover:bg-muted/40">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2 font-mono ${j === 0 ? "text-left font-sans font-medium text-foreground" : "text-right"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
