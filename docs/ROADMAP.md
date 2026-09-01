# Roadmap

Mapped from `docs/SPEC.md` (the full 66-section product spec).

## MVP (this repo, current state)
Data model, semantic/KPI layer, permissions, Report Definition engine,
query engine, rule-based AI orchestration over certified tools,
Morning Control Tower, Red Flag Engine, Opportunity Engine, Retail Health
Score, area/store/category/staff drilldown, report builder (table + KPI
cards), RBAC with area/store scoping, data ingestion API stubs, Data
Control Center, audit trail, Daily Retail Brief, PDF/Excel export with
stamping, secure report share links (with Email/WhatsApp handoff),
promotion ROI analytics, company-wide ecommerce/customer KPIs, and a
naive 7-day sales forecast.

## Phase 2 (remaining)
Real Purchasing/Supplier/Promotion/Ecommerce/Marketing/Customer data
sources (this repo's versions are grounded estimates from the mock
transaction data, not live feeds), assortment-gap analysis, price/margin
impact and price indexing, supplier OTIF/fill-rate/PPV, promotion
cannibalization across categories, the full visualization engine
(waterfall, funnel, heatmap, gauge, map, target-vs-actual, etc.), and a
true drag-and-drop report builder UI (current builder is click-to-toggle,
not drag-and-drop).

## Phase 3 (remaining)
A real machine-learned forecast (this repo has a naive linear-trend
stand-in, clearly labeled), anomaly detection, lost-sales estimation,
stockout prediction, and deeper category/supplier/customer intelligence
— needs a real analytical database (ClickHouse or equivalent) and more
historical volume than this mock dataset has.

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
