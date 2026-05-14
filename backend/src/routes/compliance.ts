import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { sendCSV, sendPDFReport, paginationMeta } from '../lib/exportUtils';

const router = express.Router();

function mapStatus(result: string): string {
  switch (result) {
    case 'COMPLIANT': return 'passed';
    case 'NON_COMPLIANT': return 'failed';
    case 'PARTIALLY_COMPLIANT': return 'warning';
    case 'REQUIRES_REVIEW': return 'pending';
    default: return 'pending';
  }
}

function mapSeverity(score: number, criticalIssues: string[]): string {
  if (criticalIssues.length > 0) return 'critical';
  if (score < 50) return 'critical';
  if (score < 70) return 'high';
  if (score < 85) return 'medium';
  return 'low';
}

// Export CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.complianceCheck.findMany({ include: { vendor: true }, orderBy: { checkedAt: 'desc' } });
    const flat = records.map(r => ({
      title: r.regulationName,
      category: r.regulationType,
      status: mapStatus(r.checkResult),
      score: r.complianceScore,
      vendorName: r.vendor?.name || 'System-wide',
      checkedAt: r.checkedAt,
    }));
    sendCSV(res, flat, 'compliance.csv', [
      { key: 'title', label: 'Regulation' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'score', label: 'Score' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'checkedAt', label: 'Checked At' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export compliance' });
  }
});

// Export PDF
router.get('/export/pdf', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.complianceCheck.findMany({ include: { vendor: true }, orderBy: { checkedAt: 'desc' } });
    const flat = records.map(r => ({
      title: r.regulationName,
      category: r.regulationType,
      status: mapStatus(r.checkResult),
      score: r.complianceScore,
      vendorName: r.vendor?.name || 'System-wide',
    }));
    sendPDFReport(res, 'Compliance Report', flat, [
      { key: 'title', label: 'Regulation' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'score', label: 'Score' },
      { key: 'vendorName', label: 'Vendor' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export compliance' });
  }
});

// Bulk delete
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.complianceCheck.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} records deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete' });
  }
});

// Bulk update
router.put('/bulk', authenticateToken, async (req, res) => {
  try {
    const { ids, data } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !data) {
      return res.status(400).json({ error: 'ids array and data are required' });
    }
    const resultMap: Record<string, string> = {
      passed: 'COMPLIANT', failed: 'NON_COMPLIANT',
      warning: 'PARTIALLY_COMPLIANT', pending: 'REQUIRES_REVIEW',
    };
    const updateData: any = {};
    if (data.status) updateData.checkResult = resultMap[data.status] || data.status;

    const result = await prisma.complianceCheck.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} records updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update' });
  }
});

// Get all compliance checks (formatted for frontend, with pagination & search)
router.get('/checks', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { regulationName: { contains: search, mode: 'insensitive' } },
        { regulationType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.complianceCheck.findMany({
        where,
        include: { vendor: true },
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.complianceCheck.count({ where }),
    ]);

    const checks = records.map(record => ({
      id: record.id,
      title: record.regulationName,
      category: record.regulationType,
      status: mapStatus(record.checkResult),
      last_check: record.checkedAt.toISOString(),
      description: record.issues.length > 0 ? record.issues.join('; ') : 'No issues found',
      severity: mapSeverity(record.complianceScore, record.criticalIssues),
      score: record.complianceScore,
      vendor_id: record.vendorId,
      vendor_name: record.vendor?.name || 'System-wide',
      issues: record.issues,
      criticalIssues: record.criticalIssues,
      recommendations: record.recommendations,
    }));

    res.json({ checks, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching compliance checks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance checks' });
  }
});

// Get compliance statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.complianceCheck.findMany();
    const total = records.length;
    const passed = records.filter(r => r.checkResult === 'COMPLIANT').length;
    const failed = records.filter(r => r.checkResult === 'NON_COMPLIANT').length;
    const pending = records.filter(r => r.checkResult === 'REQUIRES_REVIEW').length;
    const warnings = records.filter(r => r.checkResult === 'PARTIALLY_COMPLIANT').length;
    const avgScore = total > 0 ? Math.round(records.reduce((sum, r) => sum + r.complianceScore, 0) / total) : 0;
    const criticalIssues = records.filter(r => r.criticalIssues.length > 0).length;

    res.json({
      total_checks: total, passed, failed, pending, warnings,
      compliance_score: avgScore, critical_issues: criticalIssues,
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance stats' });
  }
});

// Get all compliance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { regulationName: { contains: search, mode: 'insensitive' } },
        { regulationType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.complianceCheck.findMany({
        where, include: { vendor: true },
        orderBy: { checkedAt: 'desc' }, skip, take: limit,
      }),
      prisma.complianceCheck.count({ where }),
    ]);

    res.json({ success: true, data: records, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance records' });
  }
});

// Get compliance record by ID
router.get('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const record = await prisma.complianceCheck.findUnique({
      where: { id: req.params.id },
      include: { vendor: true },
    });
    if (!record) {
      res.status(404).json({ success: false, error: 'Compliance record not found' });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance record' });
  }
});

// Create compliance check
router.post('/checks', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, severity, vendor_name } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, error: 'Title and category are required' });
    }

    let vendorId: string | undefined;
    if (vendor_name) {
      const vendor = await prisma.vendor.findFirst({ where: { name: { contains: vendor_name } } });
      if (vendor) vendorId = vendor.id;
    }

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      return res.status(500).json({ success: false, error: 'No admin user found' });
    }

    const record = await prisma.complianceCheck.create({
      data: {
        entityType: 'vendor', entityId: vendorId || 'manual-entry',
        vendorId: vendorId || null, regulationType: category,
        regulationName: title, checkResult: 'REQUIRES_REVIEW',
        complianceScore: 0, issues: description ? [description] : [],
        criticalIssues: severity === 'critical' ? ['Requires immediate attention'] : [],
        recommendations: ['Conduct detailed assessment'],
        checkedById: adminUser.id,
      },
    });

    const responseCheck = {
      id: record.id, title: record.regulationName, category: record.regulationType,
      status: 'pending', last_check: record.checkedAt.toISOString(),
      description: description || '', severity: severity || 'medium',
      score: 0, vendor_id: record.vendorId,
      vendor_name: vendor_name || 'System-wide',
      issues: record.issues, criticalIssues: record.criticalIssues,
      recommendations: record.recommendations,
    };

    return res.status(201).json({ success: true, data: responseCheck });
  } catch (error) {
    console.error('Error creating compliance check:', error);
    return res.status(500).json({ success: false, error: 'Failed to create compliance check' });
  }
});

// Update compliance check
router.put('/checks/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: 'Status is required' });
      return;
    }
    const resultMap: Record<string, string> = {
      passed: 'COMPLIANT', failed: 'NON_COMPLIANT',
      warning: 'PARTIALLY_COMPLIANT', pending: 'REQUIRES_REVIEW',
    };

    await prisma.complianceCheck.update({
      where: { id: req.params.id },
      data: { checkResult: (resultMap[status] || 'REQUIRES_REVIEW') as any },
    });

    res.json({ success: true, message: 'Compliance check updated successfully' });
  } catch (error) {
    console.error('Error updating compliance check:', error);
    res.status(500).json({ success: false, error: 'Failed to update compliance check' });
  }
});

// Delete compliance check
router.delete('/checks/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    await prisma.complianceCheck.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Compliance check deleted successfully' });
  } catch (error) {
    console.error('Error deleting compliance check:', error);
    res.status(500).json({ success: false, error: 'Failed to delete compliance check' });
  }
});

// Get compliance by vendor
router.get('/vendor/:vendorId', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.complianceCheck.findMany({
      where: { vendorId: req.params.vendorId },
      include: { vendor: true },
      orderBy: { checkedAt: 'desc' },
    });
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching vendor compliance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vendor compliance' });
  }
});

export default router;
