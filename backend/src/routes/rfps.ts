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
    const rfps = await prisma.rFP.findMany({ orderBy: { createdAt: 'desc' } });
    sendCSV(res, rfps, 'rfps.csv', [
      { key: 'title', label: 'Title' },
      { key: 'rfpNumber', label: 'RFP #' },
      { key: 'category', label: 'Category' },
      { key: 'department', label: 'Department' },
      { key: 'budget', label: 'Budget' },
      { key: 'status', label: 'Status' },
      { key: 'submissionDeadline', label: 'Deadline' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export RFPs' });
  }
});

// Export PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const rfps = await prisma.rFP.findMany({ orderBy: { createdAt: 'desc' } });
    sendPDFReport(res, 'RFPs Report', rfps, [
      { key: 'title', label: 'Title' },
      { key: 'rfpNumber', label: 'RFP #' },
      { key: 'category', label: 'Category' },
      { key: 'department', label: 'Department' },
      { key: 'budget', label: 'Budget' },
      { key: 'status', label: 'Status' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export RFPs' });
  }
});

// Bulk delete
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.rFP.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} RFPs deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete RFPs' });
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

    const result = await prisma.rFP.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} RFPs updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update RFPs' });
  }
});

// AI Generate RFP Content (must be before /:id)
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const { title, category, department, budget, description, requirements, timeline } = req.body;
    const model = AI_MODEL;

    const prompt = `Generate a comprehensive Request for Proposal (RFP) document based on these inputs:

Title: ${title}
Category: ${category}
Department: ${department}
Budget: $${budget?.toLocaleString() || 'To be determined'}
Description: ${description}
Initial Requirements: ${JSON.stringify(requirements || [])}
Timeline: ${JSON.stringify(timeline || {})}

Generate a complete RFP with the following sections in JSON format:
{
  "executiveSummary": "",
  "backgroundContext": "",
  "scopeOfWork": { "objectives": [], "deliverables": [], "outOfScope": [] },
  "technicalRequirements": [{ "category": "", "requirement": "", "priority": "mandatory/preferred/optional", "weight": 0 }],
  "functionalRequirements": [],
  "complianceRequirements": [],
  "evaluationCriteria": [{ "criterion": "", "weight": 0, "description": "" }],
  "submissionRequirements": { "format": "", "sections": [], "pageLimit": 0, "deadline": "" },
  "timeline": { "rfpRelease": "", "questionsDeadline": "", "submissionDeadline": "", "evaluationPeriod": "", "awardDate": "", "projectStart": "" },
  "termsAndConditions": [],
  "attachments": [],
  "contactInformation": {},
  "qualityScore": 0,
  "completenessScore": 0,
  "suggestions": []
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are an expert procurement professional. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000, temperature: 0.4,
    });

    const generatedContent = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    const rfpNumber = `RFP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const submissionDeadline = new Date();
    submissionDeadline.setDate(submissionDeadline.getDate() + 30);

    const rfp = await prisma.rFP.create({
      data: {
        title, rfpNumber, description: generatedContent.executiveSummary || description,
        category, department, budget, submissionDeadline,
        evaluationCriteria: generatedContent.evaluationCriteria,
        requirements: generatedContent.technicalRequirements,
        technicalSpecs: JSON.stringify(generatedContent.scopeOfWork),
        complianceReqs: generatedContent.complianceRequirements || [],
        deliverables: generatedContent.scopeOfWork?.deliverables || [],
        timeline: generatedContent.timeline,
        aiGeneratedContent: generatedContent, status: 'DRAFT',
      },
    });

    await persistAIResult({
      analysisType: 'rfp-generation',
      entityType: 'rfp',
      entityId: rfp.id,
      userId: req.user?.id,
      inputData: { title, category, department, budget, description },
      result: generatedContent,
      model,
    });

    res.json({ success: true, data: { rfp, generatedContent, generatedAt: new Date().toISOString(), model } });
  } catch (error) {
    console.error('Error generating RFP:', error);
    res.status(500).json({ success: false, error: 'Failed to generate RFP' });
  }
});

// Get all RFPs (with pagination & search)
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
        { rfpNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rfps, total] = await Promise.all([
      prisma.rFP.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.rFP.count({ where }),
    ]);

    res.json({ success: true, rfps, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch RFPs' });
  }
});

// Get single RFP
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const rfp = await prisma.rFP.findUnique({ where: { id: req.params.id } });
    if (!rfp) { res.status(404).json({ success: false, error: 'RFP not found' }); return; }
    res.json({ success: true, rfp });
  } catch (error) {
    console.error('Error fetching RFP:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch RFP' });
  }
});

// Create RFP
router.post('/', async (req, res): Promise<void> => {
  try {
    const { title, rfpNumber, description, category, department, budget, currency, submissionDeadline, evaluationCriteria, requirements, technicalSpecs, complianceReqs, deliverables, timeline } = req.body;
    if (!title || !rfpNumber || !description || !category || !department || !submissionDeadline) {
      res.status(400).json({ success: false, error: 'title, rfpNumber, description, category, department, and submissionDeadline are required' });
      return;
    }
    const rfp = await prisma.rFP.create({
      data: { title, rfpNumber, description, category, department, budget, currency, submissionDeadline: new Date(submissionDeadline), evaluationCriteria, requirements, technicalSpecs, complianceReqs: complianceReqs || [], deliverables, timeline },
    });
    res.status(201).json({ success: true, rfp });
  } catch (error) {
    console.error('Error creating RFP:', error);
    res.status(500).json({ success: false, error: 'Failed to create RFP' });
  }
});

// Update RFP
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, department, budget, currency, submissionDeadline, evaluationCriteria, requirements, technicalSpecs, complianceReqs, deliverables, timeline, status } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (department !== undefined) data.department = department;
    if (budget !== undefined) data.budget = budget;
    if (currency !== undefined) data.currency = currency;
    if (submissionDeadline !== undefined) data.submissionDeadline = new Date(submissionDeadline);
    if (evaluationCriteria !== undefined) data.evaluationCriteria = evaluationCriteria;
    if (requirements !== undefined) data.requirements = requirements;
    if (technicalSpecs !== undefined) data.technicalSpecs = technicalSpecs;
    if (complianceReqs !== undefined) data.complianceReqs = complianceReqs;
    if (deliverables !== undefined) data.deliverables = deliverables;
    if (timeline !== undefined) data.timeline = timeline;
    if (status !== undefined) data.status = status;

    const rfp = await prisma.rFP.update({ where: { id: req.params.id }, data });
    res.json({ success: true, rfp });
  } catch (error) {
    console.error('Error updating RFP:', error);
    res.status(500).json({ success: false, error: 'Failed to update RFP' });
  }
});

// Delete RFP
router.delete('/:id', async (req, res) => {
  try {
    await prisma.rFP.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'RFP deleted successfully' });
  } catch (error) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({ success: false, error: 'Failed to delete RFP' });
  }
});

// AI Enhance Existing RFP
router.post('/:id/enhance', async (req: AuthRequest, res): Promise<void> => {
  try {
    const rfp = await prisma.rFP.findUnique({ where: { id: req.params.id } });
    if (!rfp) { res.status(404).json({ success: false, error: 'RFP not found' }); return; }

    const model = AI_MODEL;

    const prompt = `Review and enhance this RFP document:

Current RFP:
Title: ${rfp.title}
Description: ${rfp.description}
Category: ${rfp.category}
Budget: $${rfp.budget?.toLocaleString()}
Requirements: ${JSON.stringify(rfp.requirements)}
Evaluation Criteria: ${JSON.stringify(rfp.evaluationCriteria)}
Technical Specs: ${rfp.technicalSpecs}

Provide improvements in JSON format:
{
  "enhancedDescription": "",
  "additionalRequirements": [],
  "improvedEvaluationCriteria": [],
  "riskConsiderations": [],
  "complianceGaps": [],
  "industryBestPractices": [],
  "suggestedQuestions": [],
  "overallAssessment": { "clarity": 0, "completeness": 0, "fairness": 0, "competitiveness": 0 },
  "recommendations": []
}`;

    const response = await openai.chat.completions.create({
      model, messages: [
        { role: 'system', content: 'You are an RFP quality reviewer. Provide constructive improvements in JSON format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500, temperature: 0.3,
    });

    const enhancements = parseAIJson(response.choices[0]?.message?.content) || { raw: response.choices[0]?.message?.content, parseError: true };

    await persistAIResult({
      analysisType: 'rfp-enhancement',
      entityType: 'rfp',
      entityId: rfp.id,
      userId: req.user?.id,
      inputData: { title: rfp.title, category: rfp.category },
      result: enhancements,
      model,
    });

    res.json({ success: true, data: { rfpId: rfp.id, enhancements, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Error enhancing RFP:', error);
    res.status(500).json({ success: false, error: 'Failed to enhance RFP' });
  }
});

export default router;
