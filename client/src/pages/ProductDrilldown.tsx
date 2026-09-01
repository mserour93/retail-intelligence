import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { SectionHeading, LoadingState, ErrorState } from "../components/shared";
import { Breadcrumb } from "./StoreDrilldown";

interface ProductDrilldownResponse {
  product: { id: string; sku: string; name: string; brand: string; price: number; categoryId: string };
  category: { id: string; name: string };
  period: { from: string; to: string };
  availabilityPct: number | null;
  priorAvailabilityPct: number | null;
  isTopSeller: boolean;
  note?: string;
}

export function ProductDrilldown() {
  const { productId } = useParams();
  const { data, loading, error } = useApi<ProductDrilldownResponse>(productId ? `/drilldown/product/${productId}` : null, [productId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const availDelta = data.availabilityPct !== null && data.priorAvailabilityPct !== null ? data.availabilityPct - data.priorAvailabilityPct : null;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: data.category.name, to: `/category/${data.category.id}` }, { label: data.product.name }]} />
      <h1 className="text-xl font-semibold text-foreground mt-2">{data.product.name}</h1>
      <p className="text-sm text-slate-500">
        {data.product.brand} · SKU {data.product.sku} · SAR {data.product.price.toFixed(2)} {data.isTopSeller && <span className="text-accent font-medium">· Top Seller</span>}
      </p>

      <SectionHeading>Why is this product important?</SectionHeading>
      <div className="bg-surface border border-border rounded-lg p-4 text-sm text-slate-700 space-y-2">
        {data.isTopSeller ? (
          <p>
            This SKU is flagged as a top seller in its category ({data.category.name}), so its availability is tracked closely — availability drops on
            top sellers translate directly into lost sales at the point of purchase.
          </p>
        ) : (
          <p>This SKU is not currently flagged as a top seller — detailed availability tracking in this MVP is limited to top-seller SKUs (see docs/ROADMAP.md).</p>
        )}
        {data.availabilityPct !== null ? (
          <p>
            Current availability across stores in scope: <span className="font-mono font-medium">{(data.availabilityPct * 100).toFixed(1)}%</span>
            {availDelta !== null && (
              <span className={availDelta < 0 ? "text-destructive" : "text-success"}>
                {" "}
                ({availDelta >= 0 ? "+" : ""}
                {(availDelta * 100).toFixed(1)}pp vs 30 days ago)
              </span>
            )}
            . {data.availabilityPct < 0.9 ? "This is below the 90% availability threshold — worth reviewing replenishment for this SKU." : "This is within the healthy range."}
          </p>
        ) : (
          <p>{data.note}</p>
        )}
      </div>
    </div>
  );
}
