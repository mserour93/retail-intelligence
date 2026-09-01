# Product Spec — AI-Native Retail Strategy, Reporting & Decision Intelligence Platform

This is the full target-state product spec as given, preserved verbatim for
reference. See `README.md` for what's actually implemented in this repo
(the MVP slice) and `ROADMAP.md` for how the rest maps to future phases.

---

## 1. Product Mission

Build a world-class, AI-native Retail Strategy, Reporting, Analytics and
Decision Intelligence Platform for a multi-store pharmacy retailer in Saudi
Arabia. The platform must become the daily decision-making companion for
the CEO, General Manager, Retail Director, Area Managers, Store Managers,
Commercial Director, Category Managers, Buyers, Merchandising teams,
Ecommerce managers, Marketing managers, Operations managers, Inventory
teams, Finance, and Analysts.

The platform must NOT be treated as a traditional BI dashboard. It must
combine governed retail data, AI conversational analytics, AI report
generation, drag-and-drop report creation, executive dashboards, retail KPI
intelligence, anomaly detection, red flags, opportunities, root-cause
analysis, management recommendations, decision support, drilldown, and
morning management routines.

The ultimate purpose: **turn data into decisions** — Data → Information →
Insight → Priority → Management Decision → Human Action → Follow-up.

## 2. Product Boundary — Decision Support, Not Execution

The platform is a **decision support system**, not an operational
execution engine. It must NOT independently change prices, inventory,
purchase orders, stock transfers, products, promotions, POS, ERP, contact
customers, approve financial transactions, or execute commercial/operational
decisions. It only provides data, analysis, visualization, explanation, red
flags, opportunities, recommendations, prioritization, and decision support.
The manager remains the decision maker. "Action" in this product always
means the action a manager should consider taking, never something the
system does.

## 3. Optional Action Tracking

Users may record management decisions against a red flag (Investigate,
Contact the store, Discuss with category team, Review pricing, Review
inventory, Monitor, Not relevant, Already handled) with owner, note, date,
follow-up date, and status. This is internal tracking only — it never
executes an external business action.

## 4. Core Product Philosophy

Always answer: what happened, why, where, how big, is it important, what
should the manager care about, what are the options, what should the
manager consider doing. Never stop at a bare metric — always continue to
driver, scope, and suggested manager considerations.

## 5. Conversational AI (mandatory)

Full conversational AI experience with maintained context — natural
questions about performance, causes, comparisons, filters, drilldowns, and
report generation/editing.

## 6-11. AI Report Builder, Presentation Modes, Drag-and-Drop, AI+Manual
Editing, Report Definition Engine, Visualization Engine

A report is built from a single structured **Report Definition** (ID, name,
description, data source, metrics, dimensions, filters, date range,
comparison, grouping, sorting, calculations, visualization, layout,
conditional formatting, drilldown paths, AI insight settings, alert
settings, permissions, owner, version, created/updated date). The same
definition renders as dashboard, table, mobile report, PDF, Excel, email,
WhatsApp, or AI analysis. Users build reports by asking AI, editing
manually via drag-and-drop, or both — both paths operate on the same
Report Definition object. Visualization engine covers KPI cards, tables,
pivot/matrix, line/bar/column/stacked/area/combo charts, waterfall, funnel,
scatter, heatmap, ranking, map, target-vs-actual, variance, sparkline,
gauge, text insight, and AI insight card; the AI selects the visualization
type based on analytical purpose.

## 12-18. Morning Retail Control Tower

The single most important daily screen, auto-scoped to the signed-in
manager's role and assigned area/store — no manual filtering needed. Area
Manager view: area executive summary (yesterday sales, growth, LFL, vs
target, transactions, ATV, units/transaction, margin, margin %, inventory
value/days, OOS%, availability%, ecommerce sales, customer metrics where
available), then Red Flags (only the most important exceptions), then
Opportunities, then Management Takeaways (3-7 points), then "What should I
look at first?" prioritized by financial impact, urgency, confidence,
scope, severity. Drilldown Area → Store → Category → Product, and Store →
Staff, available by click or by asking the AI, without needing a new
report. Store, Category, Product, and (where permitted) Staff each get a
standardized executive summary with red flags, opportunities, takeaways,
and suggested manager considerations. Staff comparisons must account for
hours worked, role, shift, responsibility, and store traffic — never a
misleading raw ranking.

## 19-21. Commercial Command Center

Dedicated module for Commercial Director, Category Managers, Buyers,
Merchandising, Pricing, and Supplier teams covering Category Performance,
Assortment (SKU counts, productive/slow/dead SKUs, new/delisted, assortment
gaps), Price (current/previous price, price/margin impact, price index,
promo price, margin after discount), Promotion (promo sales, baseline,
incremental sales/margin, discount cost, ROI, redemption, cannibalization,
post-promo effect), Supplier (sales, purchase, margin, fill rate, OTIF,
lead time, PPV, concentration), and Inventory (value, stock days, OOS,
excess, slow movers, dead stock, aging, turn, GMROI). Each category carries
a **strategic role** (Traffic Driver, Margin Driver, Basket Builder,
Destination, Seasonal, Strategic Growth, Defensive, Emerging) that the AI
must weigh when judging performance — e.g. a Traffic Driver is not judged
purely on margin.

## 22-23. Retail KPI Model & Pharmacy-Specific Analysis

A certified KPI dictionary spanning Sales, Transactions, Margin, Store
Operations, Inventory, Purchasing/Supplier, Promotions, Ecommerce,
Customer, Marketing, and Financial/Commercial domains, plus
pharmacy-specific analysis (Rx/OTC mix, chronic care, vitamins,
supplements, beauty, personal care, medical devices, seasonal healthcare,
insurance/corporate sales).

## 24. Retail Health Score

A 0-100 score with configurable weights across domains (Sales, Margin,
Inventory, Store Operations, Commercial, Ecommerce, Customer, Marketing),
showing each domain's contribution — never a meaningless flat average.

## 25-27. Red Flag Engine, Red Flag UX, Opportunity Engine

A deterministic Red Flag Engine detects sales/target/LFL/margin/transaction
/ATV deterioration, abnormal store performance, OOS, low availability,
excess/aging/slow-moving inventory, supplier failure, promotion failure,
category deterioration, unusual staff productivity, ecommerce SLA failure,
and customer deterioration. Every flag carries Flag ID, Severity, Entity,
KPI, Current/Expected Value, Variance, Threshold, Time Period, Reason,
Estimated Business Impact, Owner, Status, Created Date, and answers what's
wrong, how big, where, why, why it matters, and what to consider — never
executing the decision itself. An Opportunity Engine identifies lost sales,
margin, inventory, productivity, category growth, basket, retention,
promotion, supplier, ecommerce, and assortment opportunities, ranked by
impact, urgency, confidence, and actionability.

## 28-29. Management Action Tracking & "What Should I Care About?"

Optional tracking (Investigating/Reviewed/Acting/Monitored/Resolved/Ignore/
Comment/Assign/Follow-up date) — never executes an operational change. The
AI must prioritize, not dump data, when asked what to care about.

## 30-31. AI Answer Standard & Data Confidence

Every analytical/strategic AI answer follows: Executive Answer, Key
Numbers, What Happened, Why, Red Flags, Opportunities, Suggested Manager
Considerations, Takeaways, Data Context (period, filters, data as-of,
source, confidence). Every significant response carries a stated
confidence level (High/Medium/Low) with a reason, and the AI must never
fabricate an answer when data is stale or unavailable.

## 32-34. Data Control Center & Semantic Layer

A data-quality monitoring area (API/source status, refresh times, record
counts, rejects, duplicates, validation, schema errors, missing mappings,
staleness) that the AI consults before answering. A governed semantic layer
gives every KPI an ID, English/Arabic name, definition, formula, source,
grain, dimensions, unit, currency, time logic, target, thresholds, owner,
version, and status. The AI never invents its own KPI formula — it looks up
certified KPIs, and clearly distinguishes Certified KPI vs. Custom
Calculation vs. AI Analysis.

## 35-39. Data Architecture, AI Tool Architecture, Security, AI Token Model, Cost Control

Recommended architecture: PostgreSQL for operational data (users, roles,
permissions, reports, actions, masters, audit) and a high-performance
analytical database (ClickHouse or equivalent) for transactions, sales,
inventory, ecommerce/customer events, and historical time series, with a
backend-orchestrated LLM layer (credentials never exposed to the browser).
The AI operates only through controlled application tools
(get_user_context, get_allowed_data_scope, get_kpi_definition,
query_data, compare_periods, calculate_metric, create_report,
update_report, add/remove filter, add metric/dimension,
change_visualization, drill_down, analyze, find_red_flags,
find_opportunities, generate_summary, save_report, export_pdf/excel) —
never direct unrestricted database access. Security requires SSO, RBAC,
row-level/area/store/category/department-level security, and export/AI
permissions the AI must inherit exactly (an Area Manager can never query
outside their assigned area). AI credentials are company-managed
server-side, with model routing by task complexity and a company/user-level
AI Cost Center tracking tokens, requests, cost, and response time.

## 40-46. Mobile-First, Role Modes, Morning Briefing, Contextual AI

Mobile is a first-class experience (primary nav: Home, Reports, Ask AI, Red
Flags, Actions, More) so an Area Manager can do the full morning review on
a phone. Executive Mode (CEO/Retail Director) shows Retail Health, Sales,
LFL, Margin, Inventory, Ecommerce, Commercial, Customer, Red Flags,
Opportunities, and Key Takeaways with no operational clutter. Area Manager,
Store Manager, and Commercial Manager modes each get a role-appropriate
default view. A Daily Retail Brief is generated automatically, with
role/length variants on request ("CEO version", "5 bullets only"). Every
KPI/report/chart carries an "Ask AI" affordance with suggested
Why/Explain/Compare/Drill-down/Find-anomalies/Find-opportunities/
What-should-I-care-about prompts, and the AI receives the current report
context automatically.

## 47-50. AI-Generated Reports, Personalization, Sharing, Audit

Users request reports in plain language and the system builds them. Users
save favorite reports/filters/KPIs/prompts/dashboards/morning views, with
role-aware defaults. Reports share via PDF/Excel/Email/WhatsApp/secure
link, stamped with company, report name, generated user, role, date/time,
report ID, data-as-of, and filters. A full audit trail covers logins,
report views, AI questions/answers, queries, data scope, exports, shares,
saved/modified reports, and manager decision notes/status.

## 51-52. Data Ingestion APIs & Master Data

An API-first platform ingesting POS, ERP, ecommerce, inventory, purchasing,
supplier, CRM, loyalty, marketing, HR, CSV/Excel, and third-party sources
via endpoints like `POST /api/v1/sales`, `/transactions`, `/inventory`,
`/products`, `/stores`, `/categories`, `/customers`, `/promotions`,
`/purchases`, `/suppliers`, `/employees`, `/ecommerce/orders`,
`/marketing` — with authentication, validation, idempotency, batch
processing, error logging, duplicate protection, source tracking, and
timestamps. Configurable masters cover Company, Region, Area, City, Store
(type/cluster), Product/SKU/Barcode, Department/Category/Subcategory,
Brand, Supplier, Employee/Role, Channel, Promotion/Campaign,
Customer/Segment, Calendar (fiscal, holidays), KPI, Target/Budget/Forecast,
Category Strategy Role, and Alert Rule.

## 53-55. Retail Strategy Engine, Decision Framework, Care-About vs Consider

Every major business area is classified GROW / PROTECT / FIX / OPTIMIZE /
INVEST / EXIT-RATIONALIZE, AI-supported by data. Decisions weigh revenue,
margin, inventory, customer, operational, and cash impact plus strategic
importance, urgency, and confidence — never optimizing sales at the expense
of margin and working capital by default. The platform distinguishes "what
should I care about" (prioritization) from "what should I consider doing"
(possible responses) — the manager owns the final decision either way.

## 56-59. No-Excel Philosophy, Final UX, Success Scenario, Product Loop

The product eliminates routine manual Excel work (SUMIFS/VLOOKUP/pivot
tables/manual growth or LY comparisons/manual ranking) — Excel remains an
export option, not the analytical workflow. The system should feel like
"my Retail Control Tower," not "another reporting system": open it and
immediately see what needs attention, why, how big, what to consider, and
a path to drill down. (See the worked Area Manager morning scenario in the
original brief — health score, red flags, tap-to-drill, "Why?", "Show
products", "What should I consider?", record a decision, move on — with no
system-side execution of the decision.) The product loop is See → Understand
→ Prioritize → Decide → Act → Follow Up → Measure; the system owns the
first three steps strongly, the manager owns the actual action, and the
system can optionally record the decision and measure the result.

## 60-64. Development Principle, MVP, and Phases

Build the Retail Intelligence Core first — data model, semantic layer, KPI
engine, permissions, Report Definition, query engine, AI orchestration,
visualization engine, Morning Control Tower, Red Flag Engine, Commercial
Command Center, action/decision tracking — before a generic dashboard
builder. MVP: sales/transactions/stores/areas/products/categories/
inventory data; AI report builder and drag-and-drop builder with
tables/charts/filters/comparisons/drilldowns; conversational + contextual
AI (report generation/editing, KPI/why explanations, drilldown); Morning
Control Tower with red flags/opportunities/takeaways/considerations;
users/roles/area/store/category access; PDF/Excel/Email/WhatsApp sharing;
KPI dictionary, data freshness/confidence, and audit. Phase 2 adds the full
Commercial Command Center, Purchasing/Suppliers/Promotions/Ecommerce/
Marketing/Customers/Staff analytics. Phase 3 adds forecasting, anomaly
detection, lost-sales estimation, stockout prediction, and deeper
category/promotion/supplier/customer intelligence. Phase 4 adds
next-best-management-action ranking, scenario/what-if simulation, impact
measurement, and decision history — always staying decision support, never
autonomous execution.

## 65-66. Final Success Criteria & North Star

Success is a CEO, Retail Director, Area Manager, Store Manager, Category
Manager, or Buyer asking a natural question and getting a prioritized,
data-driven answer; a manager saying "build me a report," "explain this,"
"drill down," "compare," "what should I consider," "make this a
dashboard," or "make this mobile-friendly" and getting it immediately,
never needing Excel for the basic answer. North star: the platform is not
"the place where managers see reports" — it's **the place where retail
managers understand their business**: Ask anything, see everything
important, understand why, know where to look, know what to consider, make
the decision. The platform provides the truth and the intelligence; the
manager makes the business decision.
