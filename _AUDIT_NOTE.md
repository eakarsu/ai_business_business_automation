# Audit Apply Note — ai_procurement_management

## Audit recommendations (from batch_00.md)

Substantive project: 14 route files, 22 AI endpoints, production-grade infra (helmet, CORS, rate limit, audit log, socket.io). Health endpoint already present at `/api/health`.

### Missing AI counterparts
- AI contract language simplification (legal review readiness)
- Supplier sustainability / ESG scoring
- Spend anomaly streaming (real-time fraud detection)

### Missing non-AI features
- Invoice-to-PO matching workflow
- Supplier onboarding checklist automation
- Catalog enrichment (product images / specs scraping)

### Custom feature suggestions
- Supply chain risk intelligence (geopolitical streaming)
- Multi-language RFP generation
- Collaborative negotiation workspace
- Spend category auto-classification (NLP on invoice line items)
- Marketplace integration (Ariba, Coupa)

## Implemented in this pass

None. Project is already substantive (22 AI endpoints) and the remaining recommendations all require product decisions, schema additions, or external creds. Per the audit-apply rules, no MECHANICAL items qualified.

## Backlog (not implemented)

| Item | Category | Reason |
|---|---|---|
| AI contract language simplification | NEEDS-PRODUCT-DECISION | New endpoint contract / response schema; could be added later as a thin wrapper around `/monitor-contract` |
| Supplier ESG scoring | NEEDS-CREDS | ESG data feeds (MSCI, Sustainalytics) |
| Spend anomaly streaming | TOO-RISKY | Real-time stream pipeline |
| Invoice-to-PO matching | TOO-RISKY | OCR + 3-way match logic + schema |
| Supplier onboarding checklist | NEEDS-PRODUCT-DECISION | Workflow definition |
| Catalog enrichment | NEEDS-CREDS | Web scraping infra / image hosting |
| Geopolitical risk streaming | NEEDS-CREDS | News/events APIs |
| Multi-language RFP generation | NEEDS-PRODUCT-DECISION | Translation workflow design |
| Collaborative negotiation workspace | TOO-RISKY | Frontend feature + Slack integration |
| Spend category auto-classification | NEEDS-PRODUCT-DECISION | GL code mapping |
| Ariba / Coupa integration | NEEDS-CREDS | Marketplace APIs |

## Apply pass 5 (all backlog)

Closed the remaining backlog items by adding `backend/src/routes/aiBacklog2.ts` (mounted at `/api/ai-backlog2`) and `frontend/src/app/ai-backlog2/page.tsx`. New file is additive — no existing code path touched. Cap: 10 features.

| Item | Category | Endpoint(s) |
|---|---|---|
| Supplier ESG external feed | NEEDS-CREDS `ESG_FEED_API_KEY` | `POST /esg-score-feed` |
| Catalog enrichment | NEEDS-CREDS `CATALOG_ENRICH_API_KEY` | `POST /catalog-enrich` |
| Geopolitical risk streaming | NEEDS-CREDS `GEO_RISK_API_KEY` | `POST /geo-risk` |
| Ariba marketplace | NEEDS-CREDS `ARIBA_API_KEY` | `POST /ariba-sync` |
| Coupa marketplace | NEEDS-CREDS `COUPA_API_KEY` | `POST /coupa-sync` |
| Spend anomaly streaming | TOO-RISKY-stub (LLM scorer) | `POST /spend-anomaly-batch` |
| Invoice-to-PO 3-way match | TOO-RISKY-stub (in-memory; PRODUCT-DECISION tolerances priceBps=200, qtyBps=0) | `POST /invoice-po-match` |
| Collaborative negotiation workspace | TOO-RISKY-stub (in-memory) | `POST /negotiation/session`, `POST /negotiation/:id/message`, `GET /negotiation/:id`, `POST /negotiation/:id/close` |
| AI counter-offer suggestion | NEEDS-PRODUCT-DECISION | `POST /negotiation/:id/suggest-counter` |
| Capabilities listing | MECHANICAL | `GET /_capabilities` |

Smoke test: PASS — backend up via `ts-node --transpile-only`; logged in `admin@procurement.com`; verified `/_capabilities`, `/esg-score-feed` 503 with `missing:"ESG_FEED_API_KEY"`, `/invoice-po-match` returned a clean diff, `/negotiation/session` minted a fresh session id.

## Apply pass 4 (mechanical backlog)

Added `backend/src/routes/aiBacklog.ts` mounted at `/api/ai-backlog` with 5 stateless LLM endpoints (each returns 503 when `OPENROUTER_API_KEY` is unset/placeholder/dummy):

1. `POST /contract-simplify` — plain-English summary of contract clauses (closes "AI contract language simplification").
2. `POST /esg-score` — Environmental/Social/Governance scoring of a supplier profile (closes "Supplier ESG scoring", LLM-only — no external feeds).
3. `POST /classify-spend` — invoice line-item → spend category classification (closes "Spend category auto-classification").
4. `POST /rfp-translate` — RFP translation with glossary (closes "Multi-language RFP generation").
5. `POST /onboarding-checklist` — supplier onboarding checklist generator (closes "Supplier onboarding checklist").

FE: `frontend/src/app/ai-backlog/page.tsx` — tabbed AI Center matching existing styling, JWT bearer from `localStorage`, 503 surfaced as user-visible error.

Smoke test: PASS — backend started (transpile-only to bypass pre-existing strict TS errors not introduced here), logged in as `admin@procurement.com`, `POST /api/ai-backlog/contract-simplify` returned HTTP 503 with the configured error string.

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — FE already wired.

Frontend (Next.js App Router under `frontend/src/app/`) already has 6 dedicated AI pages: `ai-analysis`, `ai-contract-negotiator`, `ai-rfp-generator`, `ai-savings-finder`, `ai-spend-analyzer`, `ai-vendor-scorer`. Each issues `fetch(...)` calls to `/api/ai/*` endpoints (insights, recommendations, results, stats). No modifications needed.
