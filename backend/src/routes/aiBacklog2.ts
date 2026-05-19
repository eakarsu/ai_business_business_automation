// Apply pass 5 — additional backlog (categorized).
//
// ENV VARS used by NEEDS-CREDS endpoints (each returns 503 + { missing: <ENV> } when unset):
//   ESG_FEED_API_KEY            — Supplier ESG external feed (MSCI/Sustainalytics-style)
//   GEO_RISK_API_KEY            — Geopolitical risk / news streaming
//   CATALOG_ENRICH_API_KEY      — Catalog image/spec enrichment scraper
//   ARIBA_API_KEY               — SAP Ariba marketplace integration
//   COUPA_API_KEY               — Coupa marketplace integration
//
// PRODUCT-DECISION items pick a reasonable default and document it inline.
// TOO-RISKY items are additive only — in-memory stubs, no schema migration.

import express from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { parseAIJson } from '../services/aiService';

const router = express.Router();
router.use(authenticateToken);

function hasKey(): boolean {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) return false;
  if (k === 'dummy-key' || k === 'sk-dummy-key-for-openrouter') return false;
  if (/^your[_-]?openrouter[_-]?api[_-]?key/i.test(k)) return false;
  return true;
}

function envHas(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  if (/^your[_-]?/i.test(v)) return false;
  if (v === 'dummy' || v === 'changeme') return false;
  return true;
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

async function llm(system: string, user: string, maxTokens = 1500): Promise<string> {
  const openai = getClient();
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const r = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  });
  return r.choices[0]?.message?.content || '';
}

// ============================================================================
// 1. NEEDS-CREDS — Supplier ESG external feed (MSCI/Sustainalytics-style)
//    The pass-4 /esg-score uses the LLM only. This variant gates on a real feed.
// ============================================================================
router.post('/esg-score-feed', async (req: AuthRequest, res) => {
  if (!envHas('ESG_FEED_API_KEY')) {
    return res.status(503).json({ success: false, error: 'External ESG feed unavailable', missing: 'ESG_FEED_API_KEY' });
  }
  // Real implementation would call e.g. MSCI ESG API here. Intentionally no live call.
  return res.status(503).json({ success: false, error: 'ESG feed integration not implemented (creds present, integration deferred)', missing: 'ESG_FEED_API_KEY' });
});

// ============================================================================
// 2. NEEDS-CREDS — Catalog enrichment (image/spec scraping)
// ============================================================================
router.post('/catalog-enrich', async (req: AuthRequest, res) => {
  if (!envHas('CATALOG_ENRICH_API_KEY')) {
    return res.status(503).json({ success: false, error: 'Catalog enrichment unavailable', missing: 'CATALOG_ENRICH_API_KEY' });
  }
  return res.status(503).json({ success: false, error: 'Catalog enrichment integration not implemented (creds present, integration deferred)', missing: 'CATALOG_ENRICH_API_KEY' });
});

// ============================================================================
// 3. NEEDS-CREDS — Geopolitical risk streaming
// ============================================================================
router.post('/geo-risk', async (req: AuthRequest, res) => {
  if (!envHas('GEO_RISK_API_KEY')) {
    return res.status(503).json({ success: false, error: 'Geopolitical risk feed unavailable', missing: 'GEO_RISK_API_KEY' });
  }
  return res.status(503).json({ success: false, error: 'Geopolitical risk streaming not implemented (creds present, integration deferred)', missing: 'GEO_RISK_API_KEY' });
});

// ============================================================================
// 4. NEEDS-CREDS — SAP Ariba marketplace integration
// ============================================================================
router.post('/ariba-sync', async (req: AuthRequest, res) => {
  if (!envHas('ARIBA_API_KEY')) {
    return res.status(503).json({ success: false, error: 'Ariba integration unavailable', missing: 'ARIBA_API_KEY' });
  }
  return res.status(503).json({ success: false, error: 'Ariba integration not implemented (creds present, integration deferred)', missing: 'ARIBA_API_KEY' });
});

// ============================================================================
// 5. NEEDS-CREDS — Coupa marketplace integration
// ============================================================================
router.post('/coupa-sync', async (req: AuthRequest, res) => {
  if (!envHas('COUPA_API_KEY')) {
    return res.status(503).json({ success: false, error: 'Coupa integration unavailable', missing: 'COUPA_API_KEY' });
  }
  return res.status(503).json({ success: false, error: 'Coupa integration not implemented (creds present, integration deferred)', missing: 'COUPA_API_KEY' });
});

// ============================================================================
// 6. TOO-RISKY → in-memory stub. Spend anomaly streaming.
//    Real impl needs a streaming pipeline (Kafka/Kinesis). We expose a synchronous
//    "score-this-batch" endpoint backed by the LLM with no persistence.
// ============================================================================
router.post('/spend-anomaly-batch', async (req: AuthRequest, res) => {
  try {
    const { records } = req.body || {};
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'records[] is required' });
    }
    if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });

    const sys = 'You detect spend anomalies in procurement transactions. Reply ONLY with valid JSON.';
    const usr = `Score the following spend records for anomalies (duplicate invoice, off-pattern amount, off-hours, unusual vendor). Mark each.

Records: ${JSON.stringify(records).slice(0, 8000)}

Return JSON: { "anomalies": [ { "index": <int>, "score": <0-1>, "reason": "...", "severity": "low|medium|high" } ], "summary": "..." }`;
    const out = await llm(sys, usr, 1500);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('spend-anomaly-batch error:', e);
    return res.status(500).json({ success: false, error: 'Failed to score anomalies' });
  }
});

// ============================================================================
// 7. TOO-RISKY → additive new file, no schema migration. Invoice-to-PO matching.
//    Implements a synchronous 3-way-match scorer (PO ↔ invoice ↔ receipt).
// ============================================================================
// PRODUCT-DECISION: Tolerance defaults are price ±2% and quantity ±0% (exact match).
// These match common AP defaults; override via tolerance.priceBps / tolerance.qtyBps.
router.post('/invoice-po-match', async (req: AuthRequest, res) => {
  try {
    const { invoice, po, receipt, tolerance } = req.body || {};
    if (!invoice || !po) return res.status(400).json({ success: false, error: 'invoice and po are required' });

    const priceBps = (tolerance && Number.isFinite(tolerance.priceBps)) ? tolerance.priceBps : 200; // 2.00%
    const qtyBps = (tolerance && Number.isFinite(tolerance.qtyBps)) ? tolerance.qtyBps : 0;

    const findings: Array<{ field: string; po: any; invoice: any; receipt?: any; ok: boolean; reason?: string }> = [];

    function pct(a: number, b: number): number {
      if (!b) return a ? 1 : 0;
      return Math.abs(a - b) / Math.abs(b);
    }

    // Vendor / supplier
    findings.push({
      field: 'vendor',
      po: po.vendor || po.supplier,
      invoice: invoice.vendor || invoice.supplier,
      ok: !!po.vendor && !!invoice.vendor && String(po.vendor).trim().toLowerCase() === String(invoice.vendor).trim().toLowerCase(),
    });

    // Total amount
    const poTotal = Number(po.total ?? po.amount ?? 0);
    const invTotal = Number(invoice.total ?? invoice.amount ?? 0);
    const totalDelta = pct(invTotal, poTotal);
    findings.push({
      field: 'total',
      po: poTotal,
      invoice: invTotal,
      ok: totalDelta * 10000 <= priceBps,
      reason: `delta=${(totalDelta * 100).toFixed(2)}%, tolerance=${priceBps}bps`,
    });

    // Line items
    const poLines = Array.isArray(po.lines) ? po.lines : [];
    const invLines = Array.isArray(invoice.lines) ? invoice.lines : [];
    for (const pl of poLines) {
      const il = invLines.find((x: any) => x.sku === pl.sku || x.item === pl.item);
      if (!il) {
        findings.push({ field: `line:${pl.sku || pl.item}`, po: pl, invoice: null, ok: false, reason: 'missing on invoice' });
        continue;
      }
      const priceDelta = pct(Number(il.unitPrice ?? il.price ?? 0), Number(pl.unitPrice ?? pl.price ?? 0));
      const qtyDelta = pct(Number(il.quantity ?? il.qty ?? 0), Number(pl.quantity ?? pl.qty ?? 0));
      findings.push({
        field: `line:${pl.sku || pl.item}`,
        po: pl,
        invoice: il,
        ok: priceDelta * 10000 <= priceBps && qtyDelta * 10000 <= qtyBps,
        reason: `priceDelta=${(priceDelta * 100).toFixed(2)}%, qtyDelta=${(qtyDelta * 100).toFixed(2)}%`,
      });
    }

    // Receipt (optional)
    if (receipt) {
      findings.push({
        field: 'receipt',
        po: po.id ?? null,
        invoice: invoice.id ?? null,
        receipt: receipt.id ?? null,
        ok: !!receipt.received,
        reason: receipt.received ? 'received' : 'not received',
      });
    }

    const ok = findings.every((f) => f.ok);
    const summary = {
      ok,
      threeWayMatch: !!receipt,
      issues: findings.filter((f) => !f.ok).map((f) => `${f.field}: ${f.reason || 'mismatch'}`),
    };

    return res.json({ success: true, data: { summary, findings, tolerance: { priceBps, qtyBps } }, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('invoice-po-match error:', e);
    return res.status(500).json({ success: false, error: 'Failed to match invoice to PO' });
  }
});

// ============================================================================
// 8. TOO-RISKY → additive new file with in-memory store. Collaborative negotiation
//    workspace. Lets a buyer/seller append messages tracked under a session id.
// ============================================================================
// PRODUCT-DECISION: in-memory only, no auth checks beyond JWT, no Slack hand-off.
// Session retention is process-lifetime; not durable. This unblocks the FE without
// committing to a schema or external integration.
type NegMessage = { from: string; text: string; at: string };
type NegSession = { id: string; topic: string; messages: NegMessage[]; status: 'open' | 'closed'; createdAt: string };
const NEG_SESSIONS = new Map<string, NegSession>();

router.post('/negotiation/session', async (req: AuthRequest, res) => {
  const { topic } = req.body || {};
  if (!topic) return res.status(400).json({ success: false, error: 'topic is required' });
  const id = `neg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const s: NegSession = { id, topic: String(topic), messages: [], status: 'open', createdAt: new Date().toISOString() };
  NEG_SESSIONS.set(id, s);
  return res.status(201).json({ success: true, data: s });
});

router.post('/negotiation/:id/message', async (req: AuthRequest, res) => {
  const s = NEG_SESSIONS.get(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'session not found' });
  if (s.status === 'closed') return res.status(409).json({ success: false, error: 'session closed' });
  const { from, text } = req.body || {};
  if (!from || !text) return res.status(400).json({ success: false, error: 'from and text are required' });
  s.messages.push({ from: String(from), text: String(text), at: new Date().toISOString() });
  return res.json({ success: true, data: s });
});

router.get('/negotiation/:id', async (req: AuthRequest, res) => {
  const s = NEG_SESSIONS.get(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'session not found' });
  return res.json({ success: true, data: s });
});

router.post('/negotiation/:id/close', async (req: AuthRequest, res) => {
  const s = NEG_SESSIONS.get(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'session not found' });
  s.status = 'closed';
  return res.json({ success: true, data: s });
});

// ============================================================================
// 9. NEEDS-PRODUCT-DECISION — AI-assisted suggested counter for negotiation
//    Provides a counter-offer suggestion based on session state.
// ============================================================================
// PRODUCT-DECISION: Uses LLM only — no historical pricing benchmarks or vendor scorecards.
// A future revision should pull `vendors`, `bids`, and `savings` rows for context.
router.post('/negotiation/:id/suggest-counter', async (req: AuthRequest, res) => {
  const s = NEG_SESSIONS.get(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'session not found' });
  if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
  try {
    const sys = 'You are a procurement negotiator. Suggest a counter-offer based on the live thread. Reply ONLY with valid JSON.';
    const usr = `Topic: ${s.topic}
Messages so far: ${JSON.stringify(s.messages).slice(0, 6000)}

Return JSON: { "suggestedCounter": "...", "rationale": ["..."], "redLines": ["..."], "confidence": <0-1> }`;
    const out = await llm(sys, usr, 1200);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, sessionId: s.id, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('suggest-counter error:', e);
    return res.status(500).json({ success: false, error: 'Failed to suggest counter' });
  }
});

// ============================================================================
// 10. MECHANICAL — list backlog2 capabilities (handy for the FE).
// ============================================================================
router.get('/_capabilities', async (_req, res) => {
  return res.json({
    success: true,
    data: {
      capabilities: [
        { name: 'esg-score-feed', category: 'NEEDS-CREDS', env: 'ESG_FEED_API_KEY' },
        { name: 'catalog-enrich', category: 'NEEDS-CREDS', env: 'CATALOG_ENRICH_API_KEY' },
        { name: 'geo-risk', category: 'NEEDS-CREDS', env: 'GEO_RISK_API_KEY' },
        { name: 'ariba-sync', category: 'NEEDS-CREDS', env: 'ARIBA_API_KEY' },
        { name: 'coupa-sync', category: 'NEEDS-CREDS', env: 'COUPA_API_KEY' },
        { name: 'spend-anomaly-batch', category: 'TOO-RISKY-stub', env: 'OPENROUTER_API_KEY' },
        { name: 'invoice-po-match', category: 'TOO-RISKY-stub', env: null },
        { name: 'negotiation/*', category: 'TOO-RISKY-stub', env: null, note: 'in-memory only' },
        { name: 'negotiation/*/suggest-counter', category: 'NEEDS-PRODUCT-DECISION', env: 'OPENROUTER_API_KEY' },
        { name: '_capabilities', category: 'MECHANICAL', env: null },
      ],
    },
  });
});

export default router;
