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

// 1. AI contract language simplification
router.post('/contract-simplify', async (req: AuthRequest, res) => {
  try {
    const { contractText, audience } = req.body || {};
    if (!contractText) return res.status(400).json({ success: false, error: 'contractText is required' });
    if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });

    const sys = 'You simplify legal/contract language for a non-legal audience. Reply ONLY with valid JSON.';
    const usr = `Simplify the following contract text for ${audience || 'a procurement manager'}.

Contract:
${contractText}

Return JSON: { "summary": "<plain-english summary>", "simplifiedClauses": [ { "original": "...", "plain": "..." } ], "obligations": ["..."], "risks": ["..."], "redFlags": ["..."] }`;
    const out = await llm(sys, usr, 2000);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('contract-simplify error:', e);
    return res.status(500).json({ success: false, error: 'Failed to simplify contract' });
  }
});

// 2. Supplier ESG / sustainability scoring (LLM-based, no external feeds)
router.post('/esg-score', async (req: AuthRequest, res) => {
  try {
    const { supplier } = req.body || {};
    if (!supplier) return res.status(400).json({ success: false, error: 'supplier object is required' });
    if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });

    const sys = 'You are an ESG analyst. Score suppliers across Environmental, Social, Governance pillars. Reply ONLY with valid JSON.';
    const usr = `Score the supplier on ESG using the provided profile. If a pillar lacks data, lower confidence rather than inventing facts.

Supplier: ${JSON.stringify(supplier)}

Return JSON: { "overallScore": <0-100>, "confidence": <0-1>, "environmental": { "score": <0-100>, "factors": ["..."] }, "social": { "score": <0-100>, "factors": ["..."] }, "governance": { "score": <0-100>, "factors": ["..."] }, "redFlags": ["..."], "improvementAreas": ["..."] }`;
    const out = await llm(sys, usr, 1500);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('esg-score error:', e);
    return res.status(500).json({ success: false, error: 'Failed to score supplier' });
  }
});

// 3. Spend category auto-classification (NLP on invoice line items)
router.post('/classify-spend', async (req: AuthRequest, res) => {
  try {
    const { lineItems, taxonomy } = req.body || {};
    if (!Array.isArray(lineItems) || lineItems.length === 0) return res.status(400).json({ success: false, error: 'lineItems[] is required' });
    if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });

    const sys = 'You classify procurement line items into spend categories. Reply ONLY with valid JSON.';
    const usr = `Classify each line item into one of the categories. Use the provided taxonomy if given; otherwise pick a reasonable category.

Taxonomy: ${JSON.stringify(taxonomy || ['IT_EQUIPMENT', 'SOFTWARE', 'OFFICE_SUPPLIES', 'PROFESSIONAL_SERVICES', 'CONSTRUCTION', 'HEALTHCARE', 'MANUFACTURING', 'LOGISTICS', 'MARKETING', 'UTILITIES', 'MAINTENANCE', 'TRAVEL', 'OTHER'])}

Line items: ${JSON.stringify(lineItems)}

Return JSON: { "classifications": [ { "index": <int>, "category": "<from taxonomy>", "confidence": <0-1>, "rationale": "..." } ], "summary": { "byCategory": { "<cat>": <count> } } }`;
    const out = await llm(sys, usr, 2000);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('classify-spend error:', e);
    return res.status(500).json({ success: false, error: 'Failed to classify spend' });
  }
});

// 4. Multi-language RFP generation
router.post('/rfp-translate', async (req: AuthRequest, res) => {
  try {
    const { rfpText, targetLanguage } = req.body || {};
    if (!rfpText || !targetLanguage) return res.status(400).json({ success: false, error: 'rfpText and targetLanguage are required' });
    if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });

    const sys = 'You translate procurement RFP documents into the target language with terminology faithful to procurement practice. Reply ONLY with valid JSON.';
    const usr = `Translate the following RFP into ${targetLanguage}. Preserve sectioning and numerical/data values. Provide a glossary of key procurement terms.

RFP:
${rfpText}

Return JSON: { "translatedText": "...", "language": "${targetLanguage}", "glossary": [ { "term": "...", "translation": "..." } ], "notes": ["..."] }`;
    const out = await llm(sys, usr, 3000);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('rfp-translate error:', e);
    return res.status(500).json({ success: false, error: 'Failed to translate RFP' });
  }
});

// 5. Supplier onboarding checklist generator
router.post('/onboarding-checklist', async (req: AuthRequest, res) => {
  try {
    const { supplierType, jurisdiction, riskLevel } = req.body || {};
    if (!supplierType) return res.status(400).json({ success: false, error: 'supplierType is required' });
    if (!hasKey()) return res.status(503).json({ success: false, error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });

    const sys = 'You design supplier onboarding checklists. Reply ONLY with valid JSON.';
    const usr = `Generate a supplier onboarding checklist for supplierType="${supplierType}", jurisdiction="${jurisdiction || 'US'}", riskLevel="${riskLevel || 'medium'}".

Return JSON: { "phases": [ { "name": "<phase>", "items": [ { "task": "...", "owner": "...", "dueOffsetDays": <int>, "evidence": "..." } ] } ], "criticalItems": ["..."], "estimatedDays": <int> }`;
    const out = await llm(sys, usr, 2000);
    const data = parseAIJson(out) || { raw: out, parseError: true };
    return res.json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('onboarding-checklist error:', e);
    return res.status(500).json({ success: false, error: 'Failed to generate checklist' });
  }
});

export default router;
