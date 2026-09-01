# Roadmap

Mapped from `docs/SPEC.md` (the full 66-section product spec).

## MVP (this repo, current state)
Data model, semantic/KPI layer, permissions, Report Definition engine,
query engine, rule-based AI orchestration over certified tools,
Morning Control Tower, Red Flag Engine, Opportunity Engine, Retail Health
Score, area/store/category drilldown, basic report builder (table + KPI
cards), RBAC with area/store scoping, data ingestion API stubs, Data
Control Center.

## Phase 2
Commercial Command Center depth (assortment gaps, price/margin impact,
promotion ROI/cannibalization, supplier OTIF), real Purchasing/Supplier/
Promotion/Ecommerce/Marketing/Customer data sources, staff analytics with
guardrails against misleading rankings, PDF/Excel/Email/WhatsApp sharing
with report stamping, full visualization engine (waterfall, funnel,
heatmap, gauge, map, etc.), drag-and-drop report builder UI.

## Phase 3
Forecasting, anomaly detection, lost-sales estimation, stockout
prediction, category opportunity analysis, promotion/supplier/customer
intelligence — requires a real analytical database (ClickHouse or
equivalent) and historical volume this mock dataset doesn't have.

## Phase 4
Next-best-management-action ranking, strategic scenario / what-if
simulation, impact measurement, management decision history analytics.
Stays decision support — never autonomous execution.

## Infrastructure not yet stood up
- PostgreSQL (operational) + ClickHouse or equivalent (analytical) —
  MVP uses an in-memory synthetic dataset instead.
- SSO / real RBAC identity provider — MVP uses a mock persona picker.
- Hosted LLM (OpenAI or equivalent) behind a server-side orchestration
  layer with model routing and an AI Cost Center — MVP's `/api/v1/ai/ask`
  is a deterministic rule-based stand-in over the same tool contracts a
  real LLM tool-calling loop would use, so swapping in a real model later
  does not require changing the tool layer.
