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
    const records = await prisma.spendRecord.findMany({ orderBy: { transactionDate: 'desc' } });
    sendCSV(res, records, 'spend_records.csv', [
      { key: 'vendorName', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'currency', label: 'Currency' },
      { key: 'department', label: 'Department' },
      { key: 'transactionDate', label: 'Date' },
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'description', label: 'Description' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export spend records' });
  }
});

// Export PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const records = await prisma.spendRecord.findMany({ orderBy: { transactionDate: 'desc' } });
    sendPDFReport(res, 'Spend Records Report', records, [
      { key: 'vendorName', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'department', label: 'Department' },
      { key: 'transactionDate', label: 'Date' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export spend records' });
  }
});

// Bulk delete
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.spendRecord.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} records deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete spend records' });
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
    if (data.category !== undefined) updateData.category = data.category;
    if (data.department !== undefined) updateData.department = data.department;

    const result = await prisma.spendRecord.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} records updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update spend records' });
  }
});

// AI Spend Analysis (must be before /:id)
router.post('/analyze', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, focusAreas } = req.body;
    const where: any = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const spendRecords = await prisma.spendRecord.findMany({ where, orderBy: { amount: 'desc' }, take: 100 });
    const totalSpend = spendRecords.reduce((sum, r) => sum + r.amount, 0);

    const categorySpend: { [key: string]: number } = {};
    const vendorSpend: { [key: string]: number } = {};
    const departmentSpend: { [key: string]: number } = {};

    spendRecords.forEach(record => {
      categorySpend[record.category] = (categorySpend[record.category] || 0) + record.amount;
      vendorSpend[record.vendorName] = (vendorSpend[record.vendorName] || 0) + record.amount;
      departmentSpend[record.department] = (departmentSpend[record.department] || 0) + record.amount;
    });

    const model = AI_MODEL;

    const prompt = `Analyze this procurement spend data and provide insights:

Total Spend: $${totalSpend.toLocaleString()}
Number of Transactions: ${spendRecords.length}

Spend by Category:
${Object.entries(categorySpend).map(([cat, amt]) => `- ${cat}: $${amt.toLocaleString()}`).join('\n')}

Spend by Vendor (Top 10):
${Object.entries(vendorSpend).slice(0, 10).map(([vendor, amt]) => `- ${vendor}: $${amt.toLocaleString()}`).join('\n')}

Spend by Department:
${Object.entries(departmentSpend).map(([dept, amt]) => `- ${dept}: $${amt.toLocaleString()}`).join('\n')}

Focus Areas: ${JSON.stringify(focusAreas || ['cost optimization', 'vendor consolidation', 'compliance'])}

Provide comprehensive spend analysis in JSON format:
{
  "executiveSummary": "",
  "keyFindings": [],
  "spendPatterns": { "topSpendCategories": [], "growingCategories": [], "decliningCategories": [], "anomalies": [] },
  "vendorAnalysis": { "concentration": "", "consolidationOpportunities": [], "riskyConcentration": [] },
  "savingsOpportunities": [{ "area": "", "currentSpend": 0, "potentialSavings": 0, "savingsPercentage": 0, "recommendation": "", "effort": "low/medium/high", "timeframe": "" }],
  "complianceInsights": [],
  "benchmarkComparison": {},
  "recommendations": [{ "priority": "high/medium/low", "category": "", "recommendation": "", "expectedImpact": "", "implementation": "" }],
  "riskAlerts": [],
  "overallHealthScore": 0
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are a procurement spend analyst. Provide actionable insights in JSON format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, temperature: 0.3,
    });

    const analysis = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    await persistAIResult({
      analysisType: 'spend-analysis',
      userId: req.user?.id,
      inputData: { startDate, endDate, focusAreas, totalSpend, transactionCount: spendRecords.length },
      result: analysis,
      model,
    });

    res.json({
      success: true, data: {
        summary: { totalSpend, transactionCount: spendRecords.length, categoryCount: Object.keys(categorySpend).length, vendorCount: Object.keys(vendorSpend).length },
        analysis, generatedAt: new Date().toISOString(), model
      }
    });
  } catch (error) {
    console.error('Error analyzing spend:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze spend data' });
  }
});

// AI Categorize Spend
router.post('/categorize', async (req: AuthRequest, res) => {
  try {
    const { description, vendorName, amount, spendRecordId } = req.body;
    const model = AI_MODEL;

    const prompt = `Categorize this procurement transaction:

Description: ${description}
Vendor: ${vendorName}
Amount: $${amount}

Available categories: IT_EQUIPMENT, SOFTWARE, OFFICE_SUPPLIES, PROFESSIONAL_SERVICES, CONSTRUCTION, HEALTHCARE, MANUFACTURING, LOGISTICS, MARKETING, UTILITIES, MAINTENANCE, TRAVEL, OTHER

Respond in JSON format:
{ "category": "", "subcategory": "", "confidence": 0-100, "reasoning": "", "suggestedCostCenter": "", "complianceFlags": [] }`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are a procurement categorization specialist. Accurately categorize spending transactions.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500, temperature: 0.1,
    });

    const categorization = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    // Persist AI prediction to spend record if id provided
    if (spendRecordId && categorization.category && !categorization.parseError) {
      await prisma.spendRecord.update({
        where: { id: spendRecordId },
        data: {
          aiCategoryPrediction: categorization.category,
          aiInsights: categorization,
        },
      }).catch(e => console.error('Non-critical: failed to update spend record category:', e));
    }

    await persistAIResult({
      analysisType: 'spend-categorization',
      entityType: 'spend-record',
      entityId: spendRecordId,
      userId: req.user?.id,
      inputData: { description, vendorName, amount },
      result: categorization,
      model,
    });

    res.json({ success: true, data: categorization });
  } catch (error) {
    console.error('Error categorizing spend:', error);
    res.status(500).json({ success: false, error: 'Failed to categorize spend' });
  }
});

// Get spend analytics (must be before /:id)
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }

    const totalSpend = await prisma.spendRecord.aggregate({ _sum: { amount: true }, _count: true, where });
    const spendByCategory = await prisma.spendRecord.groupBy({ by: ['category'], _sum: { amount: true }, _count: true, where, orderBy: { _sum: { amount: 'desc' } } });
    const spendByDepartment = await prisma.spendRecord.groupBy({ by: ['department'], _sum: { amount: true }, _count: true, where, orderBy: { _sum: { amount: 'desc' } } });
    const spendByVendor = await prisma.spendRecord.groupBy({ by: ['vendorName'], _sum: { amount: true }, _count: true, where, orderBy: { _sum: { amount: 'desc' } }, take: 10 });

    const records = await prisma.spendRecord.findMany({ where, select: { amount: true, transactionDate: true } });
    const monthlyTrend: { [key: string]: number } = {};
    records.forEach(record => {
      const month = record.transactionDate.toISOString().slice(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + record.amount;
    });

    res.json({
      success: true, analytics: {
        totalSpend: totalSpend._sum.amount || 0,
        transactionCount: totalSpend._count || 0,
        averageTransaction: totalSpend._count ? (totalSpend._sum.amount || 0) / totalSpend._count : 0,
        spendByCategory, spendByDepartment, topVendors: spendByVendor,
        monthlyTrend: Object.entries(monthlyTrend).map(([month, amount]) => ({ month, amount })),
      }
    });
  } catch (error) {
    console.error('Error fetching spend analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch spend analytics' });
  }
});

// Get all spend records (with pagination & search)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const { category, department, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category;
    if (department) where.department = department;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }
    if (search) {
      where.OR = [
        { vendorName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [spendRecords, total] = await Promise.all([
      prisma.spendRecord.findMany({ where, orderBy: { transactionDate: 'desc' }, skip, take: limit }),
      prisma.spendRecord.count({ where }),
    ]);

    res.json({ success: true, spendRecords, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching spend records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch spend records' });
  }
});

// Get single spend record
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const record = await prisma.spendRecord.findUnique({ where: { id: req.params.id } });
    if (!record) { res.status(404).json({ success: false, error: 'Spend record not found' }); return; }
    res.json({ success: true, record });
  } catch (error) {
    console.error('Error fetching spend record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch spend record' });
  }
});

// Create spend record
router.post('/', async (req, res): Promise<void> => {
  try {
    const { vendorId, vendorName, category, amount, transactionDate, department, subcategory, currency, invoiceNumber, poNumber, costCenter, project, description, paymentMethod } = req.body;
    if (!vendorName || !category || !amount || !transactionDate || !department) {
      res.status(400).json({ success: false, error: 'vendorName, category, amount, transactionDate, and department are required' });
      return;
    }
    const record = await prisma.spendRecord.create({
      data: { vendorId, vendorName, category, amount, transactionDate: new Date(transactionDate), department, subcategory, currency, invoiceNumber, poNumber, costCenter, project, description, paymentMethod },
    });
    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error('Error creating spend record:', error);
    res.status(500).json({ success: false, error: 'Failed to create spend record' });
  }
});

// Update spend record
router.put('/:id', async (req, res) => {
  try {
    const { vendorId, vendorName, category, amount, transactionDate, department, subcategory, currency, invoiceNumber, poNumber, costCenter, project, description, paymentMethod } = req.body;
    const data: any = {};
    if (vendorId !== undefined) data.vendorId = vendorId;
    if (vendorName !== undefined) data.vendorName = vendorName;
    if (category !== undefined) data.category = category;
    if (amount !== undefined) data.amount = amount;
    if (transactionDate !== undefined) data.transactionDate = new Date(transactionDate);
    if (department !== undefined) data.department = department;
    if (subcategory !== undefined) data.subcategory = subcategory;
    if (currency !== undefined) data.currency = currency;
    if (invoiceNumber !== undefined) data.invoiceNumber = invoiceNumber;
    if (poNumber !== undefined) data.poNumber = poNumber;
    if (costCenter !== undefined) data.costCenter = costCenter;
    if (project !== undefined) data.project = project;
    if (description !== undefined) data.description = description;
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;

    const record = await prisma.spendRecord.update({ where: { id: req.params.id }, data });
    res.json({ success: true, record });
  } catch (error) {
    console.error('Error updating spend record:', error);
    res.status(500).json({ success: false, error: 'Failed to update spend record' });
  }
});

// Delete spend record
router.delete('/:id', async (req, res) => {
  try {
    await prisma.spendRecord.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Spend record deleted successfully' });
  } catch (error) {
    console.error('Error deleting spend record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete spend record' });
  }
});

export default router;
