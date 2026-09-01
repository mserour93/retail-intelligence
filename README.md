# Retail Intelligence Platform

AI-native Retail Strategy, Reporting & Decision Intelligence Platform for a
multi-store pharmacy retailer in Saudi Arabia. It is a **decision support
system**, not an operational execution engine — it never changes prices,
inventory, POS, or ERP data. It surfaces red flags, opportunities, and
management considerations; a human manager decides and acts.

## What's here (MVP)

This repo currently implements the MVP slice described in the product spec
(`docs/SPEC.md`, section 61), built end-to-end on **synthetic mock data**
so the full decision loop is demonstrable without real POS/ERP integrations:

- `server/` — Node/Express/TypeScript API:
  - Master + synthetic transactional data generator (areas, stores,
    categories, products, 60 days of daily facts, inventory, targets)
  - Certified **KPI dictionary** (semantic layer) — every KPI has an ID,
    definition, formula description, grain, and unit; nothing is computed
    ad hoc outside it
  - **Report Definition** engine (CRUD + query execution against the
    semantic layer)
  - Deterministic **Red Flag Engine** and **Opportunity Engine**
  - **Retail Health Score** (weighted, configurable domains)
  - **Morning Control Tower** endpoint (role + area/store scope aware)
  - Rule-based **conversational AI** endpoint (`/api/v1/ai/ask`) — intent
    matching over the certified KPI/red-flag/opportunity tools, following
    the "Executive Answer / Key Numbers / Why / Red Flags / Opportunities /
    Considerations / Takeaways / Data Context" answer standard. It is
    **not** wired to a hosted LLM (no API key is configured in this
    environment) — swap `engines/aiOrchestrator.ts`'s intent matcher for a
    real LLM tool-calling loop when a provider key is available; the tool
    contracts it calls (`getKpi`, `findRedFlags`, `findOpportunities`,
    `queryReport`, `drillDown`) are already the shape an LLM orchestrator
    would call.
  - RBAC middleware: role + area/store/category scoping, enforced on every
    query (an Area Manager cannot query outside their assigned area)
  - Data ingestion API stubs (`POST /api/v1/sales`, `/inventory`, etc.)
    with validation, idempotency keys, and a Data Control Center status
    endpoint
  - **Staff analytics** (sales/hour, never a raw ranking — role/shift/hours
    always shown alongside), **PDF/Excel export** with stamping, an
    **audit trail**, a **Daily Retail Brief** (5-bullet mode included),
    company-wide **ecommerce and customer KPIs**, a **promotion ROI**
    engine (real promo windows with before/after baseline estimates), a
    naive **7-day sales forecast**, and **secure share links** for reports
    (public, read-only, no login, scoped to the owner's RBAC access)
- `client/` — Vite/React/TypeScript/Tailwind, mobile-first:
  - Role-aware login (mock SSO — pick a persona)
  - Morning Control Tower (Area Manager / Store Manager) with a 7-day
    sales forecast chart
  - Executive Mode (CEO / Retail Director) with ecommerce/customer KPIs
  - Commercial Command Center (category/assortment/price/**promotion
    ROI**/supplier/inventory)
  - Area → Store → Category → Product → **Staff** drilldown
  - Ask AI conversational panel (contextual, suggested prompts, 5-bullet brief)
  - Red Flags & Opportunities feed with optional decision tracking
    (Investigate / Discuss / Monitor / Not Relevant — recorded only,
    never executed against any business system)
  - Report Builder (metrics/dimensions/filters/comparison → table or
    KPI-card presentation), **PDF/Excel export**, and **save & share** a
    secure link (with Email/WhatsApp handoff via `mailto:`/`wa.me`)
  - Data Control Center (data freshness/quality panel)
  - My Activity (audit trail)

## What's explicitly NOT in this repo

Real POS/ERP/ecommerce/CRM integrations, PostgreSQL/ClickHouse
infrastructure, SSO, and a hosted LLM key are **out of scope** — they need
real credentials/infra this environment doesn't have. Email/WhatsApp use
the browser's own `mailto:`/`wa.me` handoff rather than a fabricated
send API for the same reason. The forecast is a labeled naive linear
trend, not a machine-learned model. Ecommerce/customer metrics are
company-wide estimates derived from transaction volume, not a real
ecommerce platform or CRM feed. See `docs/SPEC.md` for the full target
spec and `docs/ROADMAP.md` for what's left. The architecture (semantic
layer, Report Definition object, RBAC scope filters, AI tool contracts)
is built so real integrations can be added without a rewrite.

## Running locally

```bash
cd server && npm install && npm run dev   # http://localhost:4000
cd client && npm install && npm run dev   # http://localhost:5173
```
