import express from 'express';
import { prisma } from '../lib/prisma';
import OpenAI from 'openai';
import { sendCSV, sendPDFReport, paginationMeta } from '../lib/exportUtils';
import { parseAIJson, persistAIResult } from '../services/aiService';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const AI_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const contracts = await prisma.contract.findMany({ orderBy: { createdAt: 'desc' } });
    sendCSV(res, contracts, 'contracts.csv', [
      { key: 'title', label: 'Title' },
      { key: 'contractNumber', label: 'Contract #' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'totalValue', label: 'Total Value' },
      { key: 'status', label: 'Status' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export contracts' });
  }
});

// Export PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const contracts = await prisma.contract.findMany({ orderBy: { createdAt: 'desc' } });
    sendPDFReport(res, 'Contracts Report', contracts, [
      { key: 'title', label: 'Title' },
      { key: 'contractNumber', label: 'Contract #' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'totalValue', label: 'Total Value' },
      { key: 'status', label: 'Status' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export contracts' });
  }
});

// Bulk delete
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.contract.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} contracts deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete contracts' });
  }
});

// Bulk update
router.put('/bulk', async (req, res) => {
  try {
    const { ids, data } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !data) {
      return res.status(400).json({ error: 'ids array and data are required' });
    }
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;

    const result = await prisma.contract.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} contracts updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update contracts' });
  }
});

// Get all contracts (with pagination & search)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.contract.count({ where }),
    ]);

    res.json({ success: true, contracts, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contracts' });
  }
});

// Get single contract
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) { res.status(404).json({ success: false, error: 'Contract not found' }); return; }
    res.json({ success: true, contract });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contract' });
  }
});

// Create contract
router.post('/', async (req, res): Promise<void> => {
  try {
    const { title, contractNumber, vendorId, vendorName, description, category, startDate, endDate, totalValue, currency, paymentTerms, deliveryTerms, warrantyTerms, liabilityTerms, terminationClause, renewalClause, status, riskLevel, terms } = req.body;
    if (!title || !contractNumber || !vendorId || !vendorName || !category || !startDate || !endDate || totalValue === undefined) {
      res.status(400).json({ success: false, error: 'title, contractNumber, vendorId, vendorName, category, startDate, endDate, and totalValue are required' });
      return;
    }
    const contract = await prisma.contract.create({
      data: { title, contractNumber, vendorId, vendorName, description, category, startDate: new Date(startDate), endDate: new Date(endDate), totalValue, currency, paymentTerms, deliveryTerms, warrantyTerms, liabilityTerms, terminationClause, renewalClause, status, riskLevel, terms },
    });
    res.status(201).json({ success: true, contract });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ success: false, error: 'Failed to create contract' });
  }
});

// Update contract
router.put('/:id', async (req, res) => {
  try {
    const { title, vendorName, description, category, startDate, endDate, totalValue, currency, paymentTerms, deliveryTerms, warrantyTerms, liabilityTerms, terminationClause, renewalClause, status, riskLevel, terms } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (vendorName !== undefined) data.vendorName = vendorName;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (totalValue !== undefined) data.totalValue = totalValue;
    if (currency !== undefined) data.currency = currency;
    if (paymentTerms !== undefined) data.paymentTerms = paymentTerms;
    if (deliveryTerms !== undefined) data.deliveryTerms = deliveryTerms;
    if (warrantyTerms !== undefined) data.warrantyTerms = warrantyTerms;
    if (liabilityTerms !== undefined) data.liabilityTerms = liabilityTerms;
    if (terminationClause !== undefined) data.terminationClause = terminationClause;
    if (renewalClause !== undefined) data.renewalClause = renewalClause;
    if (status !== undefined) data.status = status;
    if (riskLevel !== undefined) data.riskLevel = riskLevel;
    if (terms !== undefined) data.terms = terms;

    const contract = await prisma.contract.update({ where: { id: req.params.id }, data });
    res.json({ success: true, contract });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ success: false, error: 'Failed to update contract' });
  }
});

// Delete contract
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ success: false, error: 'Failed to delete contract' });
  }
});

// AI Contract Negotiation Analysis
router.post('/:id/negotiate', async (req: AuthRequest, res): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) { res.status(404).json({ success: false, error: 'Contract not found' }); return; }

    const { negotiationGoals, constraints } = req.body;
    const model = AI_MODEL;

    const prompt = `Analyze this contract and provide negotiation recommendations.

Contract Details:
- Title: ${contract.title}
- Vendor: ${contract.vendorName}
- Total Value: $${contract.totalValue?.toLocaleString()}
- Payment Terms: ${contract.paymentTerms}
- Delivery Terms: ${contract.deliveryTerms}
- Warranty Terms: ${contract.warrantyTerms}
- Liability Terms: ${contract.liabilityTerms}
- Current Terms: ${JSON.stringify(contract.terms)}

Negotiation Goals: ${JSON.stringify(negotiationGoals || 'Optimize terms and reduce costs')}
Constraints: ${JSON.stringify(constraints || 'Standard business constraints')}

Provide your analysis as ONLY valid JSON (no markdown, no explanatory text) with this exact structure:
{
  "analysis": { "strengths": ["str1"], "weaknesses": ["w1"], "opportunities": ["o1"], "threats": ["t1"] },
  "negotiationPoints": [{ "term": "Payment Terms", "priority": "high", "currentValue": "Net 30", "targetValue": "Net 60", "rationale": "reason" }],
  "counterProposals": [{ "term": "Pricing", "proposedChange": "10% discount", "justification": "reason" }],
  "riskAssessment": { "overallRisk": "medium", "riskFactors": ["risk1"], "mitigationStrategies": ["strategy1"] },
  "successProbability": 75,
  "estimatedSavings": { "amount": 50000, "percentage": 10 },
  "nextSteps": ["step1", "step2"]
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are an expert contract negotiator. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, temperature: 0.3,
    });

    const aiAnalysis = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    try {
      const existingHistory = Array.isArray(contract.negotiationHistory) ? contract.negotiationHistory : [];
      await prisma.contract.update({
        where: { id: req.params.id },
        data: { aiAnalysis, negotiationHistory: [...(existingHistory as any[]), { timestamp: new Date().toISOString(), analysis: aiAnalysis }] },
      });
    } catch (dbError) {
      console.error('Non-critical: Failed to save AI analysis to DB:', dbError);
    }

    await persistAIResult({
      analysisType: 'contract-negotiation',
      entityType: 'contract',
      entityId: contract.id,
      userId: (req as AuthRequest).user?.id,
      inputData: { negotiationGoals, constraints },
      result: aiAnalysis,
      model,
    });

    res.json({ success: true, data: { contractId: contract.id, aiAnalysis, generatedAt: new Date().toISOString(), model } });
  } catch (error) {
    console.error('Error in contract negotiation:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze contract for negotiation' });
  }
});

// AI Contract Risk Analysis
router.post('/:id/risk-analysis', async (req: AuthRequest, res): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) { res.status(404).json({ success: false, error: 'Contract not found' }); return; }

    const model = AI_MODEL;

    const prompt = `Perform a comprehensive risk analysis for this contract:

Contract: ${contract.title}
Vendor: ${contract.vendorName}
Value: $${contract.totalValue?.toLocaleString()}
Duration: ${contract.startDate} to ${contract.endDate}
Terms: ${JSON.stringify(contract.terms)}

Provide your analysis as ONLY valid JSON:
{
  "overallRiskScore": 65,
  "riskLevel": "medium",
  "riskCategories": [
    { "category": "Financial Risk", "score": 60, "level": "medium", "factors": ["factor1"], "mitigations": ["mitigation1"] }
  ],
  "criticalIssues": ["issue1"],
  "recommendations": ["recommendation1"],
  "monitoringPoints": ["point1"]
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are a contract risk analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000, temperature: 0.2,
    });

    const riskAnalysis = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    // Persist risk analysis to contract record and ai_results
    await Promise.all([
      prisma.contract.update({
        where: { id: req.params.id },
        data: {
          aiAnalysis: { ...(contract.aiAnalysis as any || {}), riskAnalysis, riskAnalyzedAt: new Date().toISOString() },
          riskLevel: (riskAnalysis.riskLevel as any) || contract.riskLevel,
        },
      }).catch(e => console.error('Non-critical: failed to update contract risk:', e)),
      persistAIResult({
        analysisType: 'contract-risk-analysis',
        entityType: 'contract',
        entityId: contract.id,
        userId: req.user?.id,
        inputData: { title: contract.title, totalValue: contract.totalValue },
        result: riskAnalysis,
        model,
      }),
    ]);

    res.json({ success: true, data: { contractId: contract.id, riskAnalysis, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Error in risk analysis:', error);
    res.status(500).json({ success: false, error: 'Failed to perform risk analysis' });
  }
});

export default router;
