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
    const opps = await prisma.savingsOpportunity.findMany({ orderBy: { projectedSavings: 'desc' } });
    sendCSV(res, opps, 'savings.csv', [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'savingsType', label: 'Type' },
      { key: 'currentSpend', label: 'Current Spend' },
      { key: 'projectedSavings', label: 'Projected Savings' },
      { key: 'savingsPercentage', label: 'Savings %' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'status', label: 'Status' },
      { key: 'riskLevel', label: 'Risk' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export savings' });
  }
});

// Export PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const opps = await prisma.savingsOpportunity.findMany({ orderBy: { projectedSavings: 'desc' } });
    sendPDFReport(res, 'Savings Opportunities Report', opps, [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'projectedSavings', label: 'Projected Savings' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'status', label: 'Status' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export savings' });
  }
});

// Bulk delete
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.savingsOpportunity.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} opportunities deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete savings' });
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

    const result = await prisma.savingsOpportunity.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} opportunities updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update savings' });
  }
});

// Get savings summary (must be before /:id)
router.get('/analytics/summary', async (req, res) => {
  try {
    const opportunities = await prisma.savingsOpportunity.findMany();
    const summary = {
      totalOpportunities: opportunities.length,
      totalProjectedSavings: opportunities.reduce((sum, o) => sum + o.projectedSavings, 0),
      totalRealizedSavings: opportunities.reduce((sum, o) => sum + (o.realizedSavings || 0), 0),
      totalCurrentSpend: opportunities.reduce((sum, o) => sum + o.currentSpend, 0),
      byStatus: {} as { [key: string]: { count: number; amount: number } },
      byType: {} as { [key: string]: { count: number; amount: number } },
      byCategory: {} as { [key: string]: { count: number; amount: number } },
      averageConfidence: opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length || 0,
    };

    opportunities.forEach(o => {
      if (!summary.byStatus[o.status]) summary.byStatus[o.status] = { count: 0, amount: 0 };
      summary.byStatus[o.status]!.count++;
      summary.byStatus[o.status]!.amount += o.projectedSavings;

      if (!summary.byType[o.savingsType]) summary.byType[o.savingsType] = { count: 0, amount: 0 };
      summary.byType[o.savingsType]!.count++;
      summary.byType[o.savingsType]!.amount += o.projectedSavings;

      if (!summary.byCategory[o.category]) summary.byCategory[o.category] = { count: 0, amount: 0 };
      summary.byCategory[o.category]!.count++;
      summary.byCategory[o.category]!.amount += o.projectedSavings;
    });

    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch savings summary' });
  }
});

// AI Find Savings Opportunities (must be before /:id)
router.post('/find', async (req: AuthRequest, res) => {
  try {
    const spendRecords = await prisma.spendRecord.findMany({ orderBy: { amount: 'desc' }, take: 200 });
    const vendors = await prisma.vendor.findMany({ take: 50 });
    const contracts = await prisma.contract.findMany({ take: 50 });

    const categorySpend: { [key: string]: number } = {};
    const vendorSpend: { [key: string]: { total: number; count: number } } = {};

    spendRecords.forEach(record => {
      categorySpend[record.category] = (categorySpend[record.category] || 0) + record.amount;
      if (!vendorSpend[record.vendorName]) vendorSpend[record.vendorName] = { total: 0, count: 0 };
      vendorSpend[record.vendorName]!.total += record.amount;
      vendorSpend[record.vendorName]!.count++;
    });

    const model = AI_MODEL;

    const prompt = `Analyze procurement data and identify savings opportunities:

SPEND DATA:
Total Records: ${spendRecords.length}
By Category:
${Object.entries(categorySpend).map(([cat, amt]) => `- ${cat}: $${amt.toLocaleString()}`).join('\n')}

Top Vendors by Spend:
${Object.entries(vendorSpend).sort(([,a], [,b]) => b.total - a.total).slice(0, 15).map(([vendor, data]) => `- ${vendor}: $${data.total.toLocaleString()} (${data.count} transactions)`).join('\n')}

VENDOR DATA:
${vendors.slice(0, 10).map(v => `- ${v.name}: Score ${v.overallScore}, Risk ${v.riskLevel}`).join('\n')}

CONTRACTS:
${contracts.slice(0, 10).map(c => `- ${c.title}: $${c.totalValue?.toLocaleString()}, Status: ${c.status}`).join('\n')}

Identify savings opportunities. Respond in JSON format:
{
  "opportunities": [
    { "title": "", "description": "", "category": "IT_EQUIPMENT/SOFTWARE/OTHER", "savingsType": "VOLUME_DISCOUNT/CONTRACT_CONSOLIDATION/SUPPLIER_SWITCHING/PROCESS_IMPROVEMENT/DEMAND_REDUCTION/PAYMENT_TERM_OPTIMIZATION/SPECIFICATION_CHANGE/RENEGOTIATION/COMPETITIVE_BIDDING/MAVERICK_SPEND_REDUCTION", "currentSpend": 0, "projectedSavings": 0, "savingsPercentage": 0, "confidence": 0, "implementationEffort": "low/medium/high", "timeToRealize": 0, "riskLevel": "LOW/MEDIUM/HIGH", "vendorName": "", "aiRecommendation": "", "actionItems": [] }
  ],
  "totalProjectedSavings": 0,
  "priorityRecommendations": [],
  "quickWins": [],
  "longTermStrategies": []
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are a procurement savings specialist. Identify realistic savings opportunities. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000, temperature: 0.3,
    });

    const analysis = parseAIJson(response.choices[0]?.message?.content) || {};
    if (!analysis.opportunities) analysis.opportunities = [];

    const savedOpportunities = [];
    for (const opp of analysis.opportunities || []) {
      try {
        const saved = await prisma.savingsOpportunity.create({
          data: {
            title: opp.title, description: opp.description,
            category: opp.category || 'OTHER', savingsType: opp.savingsType || 'PROCESS_IMPROVEMENT',
            currentSpend: opp.currentSpend || 0, projectedSavings: opp.projectedSavings || 0,
            savingsPercentage: opp.savingsPercentage || 0, confidence: opp.confidence || 70,
            implementationEffort: opp.implementationEffort || 'medium', timeToRealize: opp.timeToRealize || 90,
            riskLevel: opp.riskLevel || 'MEDIUM', vendorName: opp.vendorName || null,
            aiRecommendation: opp.aiRecommendation || '', actionItems: opp.actionItems || [],
            aiAnalysis: opp, status: 'IDENTIFIED',
          },
        });
        savedOpportunities.push(saved);
      } catch (err) {
        console.error('Error saving opportunity:', err);
      }
    }

    await persistAIResult({
      analysisType: 'savings-finder',
      userId: req.user?.id,
      inputData: { spendRecordCount: spendRecords.length, vendorCount: vendors.length, contractCount: contracts.length },
      result: analysis,
      model,
    });

    res.json({
      success: true, data: {
        opportunities: savedOpportunities,
        analysis: { totalProjectedSavings: analysis.totalProjectedSavings, priorityRecommendations: analysis.priorityRecommendations, quickWins: analysis.quickWins, longTermStrategies: analysis.longTermStrategies },
        generatedAt: new Date().toISOString(), model
      }
    });
  } catch (error) {
    console.error('Error finding savings:', error);
    res.status(500).json({ success: false, error: 'Failed to find savings opportunities' });
  }
});

// Get all savings opportunities (with pagination & search)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const { status, category, minSavings } = req.query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (minSavings) where.projectedSavings = { gte: parseFloat(minSavings as string) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [opportunities, total] = await Promise.all([
      prisma.savingsOpportunity.findMany({ where, orderBy: { projectedSavings: 'desc' }, skip, take: limit }),
      prisma.savingsOpportunity.count({ where }),
    ]);

    res.json({ success: true, opportunities, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching savings opportunities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch savings opportunities' });
  }
});

// Get single savings opportunity
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const opportunity = await prisma.savingsOpportunity.findUnique({ where: { id: req.params.id } });
    if (!opportunity) { res.status(404).json({ success: false, error: 'Savings opportunity not found' }); return; }
    res.json({ success: true, opportunity });
  } catch (error) {
    console.error('Error fetching savings opportunity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch savings opportunity' });
  }
});

// Create savings opportunity
router.post('/', async (req, res): Promise<void> => {
  try {
    const { title, description, category, savingsType, currentSpend, projectedSavings, savingsPercentage, confidence, implementationEffort, timeToRealize, riskLevel, vendorId, vendorName, aiRecommendation, actionItems, currency } = req.body;
    if (!title || !description || !category || !savingsType || currentSpend === undefined || projectedSavings === undefined || savingsPercentage === undefined || confidence === undefined || !implementationEffort || timeToRealize === undefined || !aiRecommendation) {
      res.status(400).json({ success: false, error: 'Required fields missing' });
      return;
    }
    const opportunity = await prisma.savingsOpportunity.create({
      data: { title, description, category, savingsType, currentSpend, projectedSavings, savingsPercentage, confidence, implementationEffort, timeToRealize, riskLevel, vendorId, vendorName, aiRecommendation, actionItems: actionItems || [], currency },
    });
    res.status(201).json({ success: true, opportunity });
  } catch (error) {
    console.error('Error creating savings opportunity:', error);
    res.status(500).json({ success: false, error: 'Failed to create savings opportunity' });
  }
});

// Update savings opportunity
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, savingsType, currentSpend, projectedSavings, savingsPercentage, confidence, implementationEffort, timeToRealize, riskLevel, vendorId, vendorName, aiRecommendation, actionItems, status, realizedSavings, realizedAt, currency } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (savingsType !== undefined) data.savingsType = savingsType;
    if (currentSpend !== undefined) data.currentSpend = currentSpend;
    if (projectedSavings !== undefined) data.projectedSavings = projectedSavings;
    if (savingsPercentage !== undefined) data.savingsPercentage = savingsPercentage;
    if (confidence !== undefined) data.confidence = confidence;
    if (implementationEffort !== undefined) data.implementationEffort = implementationEffort;
    if (timeToRealize !== undefined) data.timeToRealize = timeToRealize;
    if (riskLevel !== undefined) data.riskLevel = riskLevel;
    if (vendorId !== undefined) data.vendorId = vendorId;
    if (vendorName !== undefined) data.vendorName = vendorName;
    if (aiRecommendation !== undefined) data.aiRecommendation = aiRecommendation;
    if (actionItems !== undefined) data.actionItems = actionItems;
    if (status !== undefined) data.status = status;
    if (realizedSavings !== undefined) data.realizedSavings = realizedSavings;
    if (realizedAt !== undefined) data.realizedAt = new Date(realizedAt);
    if (currency !== undefined) data.currency = currency;

    const opportunity = await prisma.savingsOpportunity.update({ where: { id: req.params.id }, data });
    res.json({ success: true, opportunity });
  } catch (error) {
    console.error('Error updating savings opportunity:', error);
    res.status(500).json({ success: false, error: 'Failed to update savings opportunity' });
  }
});

// Delete savings opportunity
router.delete('/:id', async (req, res) => {
  try {
    await prisma.savingsOpportunity.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Savings opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting savings opportunity:', error);
    res.status(500).json({ success: false, error: 'Failed to delete savings opportunity' });
  }
});

// AI Analyze Specific Opportunity
router.post('/:id/analyze', async (req: AuthRequest, res): Promise<void> => {
  try {
    const opportunity = await prisma.savingsOpportunity.findUnique({ where: { id: req.params.id } });
    if (!opportunity) { res.status(404).json({ success: false, error: 'Opportunity not found' }); return; }

    const model = AI_MODEL;

    const prompt = `Provide detailed analysis for this savings opportunity:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Category: ${opportunity.category}
Type: ${opportunity.savingsType}
Current Spend: $${opportunity.currentSpend.toLocaleString()}
Projected Savings: $${opportunity.projectedSavings.toLocaleString()}
Confidence: ${opportunity.confidence}%
Risk Level: ${opportunity.riskLevel}

Provide detailed implementation plan in JSON format:
{
  "feasibilityAssessment": { "score": 0, "strengths": [], "challenges": [], "dependencies": [] },
  "implementationPlan": { "phases": [{ "name": "", "duration": "", "activities": [], "deliverables": [], "resources": [] }], "totalDuration": "", "keyMilestones": [] },
  "riskAnalysis": { "risks": [{ "risk": "", "likelihood": "low/medium/high", "impact": "low/medium/high", "mitigation": "" }] },
  "resourceRequirements": { "people": [], "tools": [], "budget": 0 },
  "successMetrics": [],
  "revisedSavingsEstimate": { "conservative": 0, "realistic": 0, "optimistic": 0 },
  "recommendations": []
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are a procurement implementation specialist. Provide detailed, actionable implementation plans.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, temperature: 0.3,
    });

    const detailedAnalysis = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    await prisma.savingsOpportunity.update({
      where: { id: req.params.id },
      data: { aiAnalysis: { ...(opportunity.aiAnalysis as any || {}), detailedAnalysis, analyzedAt: new Date().toISOString() } },
    });

    await persistAIResult({
      analysisType: 'savings-opportunity-analysis',
      entityType: 'savings-opportunity',
      entityId: opportunity.id,
      userId: req.user?.id,
      inputData: { title: opportunity.title, currentSpend: opportunity.currentSpend, projectedSavings: opportunity.projectedSavings },
      result: detailedAnalysis,
      model,
    });

    res.json({ success: true, data: { opportunityId: opportunity.id, detailedAnalysis, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Error analyzing opportunity:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze opportunity' });
  }
});

export default router;
