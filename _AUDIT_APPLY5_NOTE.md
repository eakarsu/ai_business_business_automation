# Apply Pass 5 — ai_procurement_management

- **Date:** 2026-05-08
- **Project:** ai_procurement_management
- **Stack:** Node.js + Express (TS) + React + Prisma. Helmet, CORS, rate-limit, audit log, socket.io. Existing helper `callOpenRouter` returns 503 on missing/placeholder/dummy `OPENROUTER_API_KEY`.
- **Audit source:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_00.md` section 3
- **Action:** LEFT-AS-IS (verified prior pass-4 + pass-5 implementations present on disk)

## Verified present (substantive — 22 AI endpoints already)

`/insights`, `/recommendations`, `/risk-assessment`, `/market-analysis`, `/stats`, `/performance`, `/vendor-scores`, `/bid-analysis`, `/trigger-analysis`, `/analysis-status/:jobId`, `/bulk-trigger`, `/schedule-analysis`, `/discover-opportunities`, `/optimize-bid`, `/generate-proposal`, `/monitor-contract`, `/chat-query`, `/negotiate-terms`, `/vendor-score/stream`, `/rfp/generate`, `/results`, `/results/:id`. Pass-4 added `/api/ai-backlog/{contract-simplify, esg-score, classify-spend, rfp-translate, onboarding-checklist}` + FE `frontend/src/app/ai-backlog/page.tsx`.

## Implemented (verified on disk — pass-5 already done; over-cap at 10 items, not undone)

`backend/src/routes/aiBacklog2.ts` mounted at `/api/ai-backlog2` and `frontend/src/app/ai-backlog2/page.tsx`:

- `POST /esg-score-feed` — NEEDS-CREDS `ESG_FEED_API_KEY` (503 when unset)
- `POST /catalog-enrich` — NEEDS-CREDS `CATALOG_ENRICH_API_KEY`
- `POST /geo-risk` — NEEDS-CREDS `GEO_RISK_API_KEY`
- `POST /ariba-sync` — NEEDS-CREDS `ARIBA_API_KEY`
- `POST /coupa-sync` — NEEDS-CREDS `COUPA_API_KEY`
- `POST /spend-anomaly-batch` — TOO-RISKY-stub via LLM scorer
- `POST /invoice-po-match` — TOO-RISKY-stub, in-memory 3-way match (priceBps=200, qtyBps=0)
- `POST /negotiation/session`, `/:id/message`, `/:id`, `/:id/close`, `/:id/suggest-counter` — collaborative negotiation workspace, in-memory
- `GET /_capabilities`

## Deferred

None outright. Stubs documented in `_BACKLOG_NEEDS_CREDS.md`-equivalent fashion inline (each 503 lists its `missing` env). Real implementations of ESG/catalog/geo/Ariba/Coupa await credentials. Negotiation workspace + invoice-PO-match stubs are TOO-RISKY for production state and noted in `_AUDIT_NOTE.md` for follow-up.

## Smoke test

Per `_AUDIT_NOTE.md`: PASS — backend up via `ts-node --transpile-only`; logged in as `admin@procurement.com`; verified `/_capabilities`, `/esg-score-feed` returned 503 with `missing:"ESG_FEED_API_KEY"`, `/invoice-po-match` returned a clean diff, `/negotiation/session` minted a fresh session id.
