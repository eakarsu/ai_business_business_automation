import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { sendCSV, sendPDFReport, paginationMeta } from '../lib/exportUtils';

const router = express.Router();

// Export CSV
router.get('/export/csv', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const bids = await prisma.bid.findMany({ where: { tenantId: req.user!.tenantId }, include: { vendor: true, product: true }, orderBy: { submittedAt: 'desc' } });
    const flat = bids.map(b => ({ ...b, vendorName: b.vendor?.name, productName: b.product?.name }));
    sendCSV(res, flat, 'bids.csv', [
      { key: 'title', label: 'Title' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'productName', label: 'Product' },
      { key: 'proposedAmount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'submittedAt', label: 'Submitted' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export bids' });
  }
});

// Export PDF
router.get('/export/pdf', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const bids = await prisma.bid.findMany({ where: { tenantId: req.user!.tenantId }, include: { vendor: true, product: true }, orderBy: { submittedAt: 'desc' } });
    const flat = bids.map(b => ({ ...b, vendorName: b.vendor?.name, productName: b.product?.name }));
    sendPDFReport(res, 'Bids Report', flat, [
      { key: 'title', label: 'Title' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'productName', label: 'Product' },
      { key: 'proposedAmount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export bids' });
  }
});

// Bulk delete
router.delete('/bulk', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.bid.deleteMany({ where: { id: { in: ids }, tenantId: req.user!.tenantId } });
    return res.json({ message: `${result.count} bids deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete bids' });
  }
});

// Bulk update
router.put('/bulk', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER', 'EVALUATOR'), async (_req, res) => {
  return res.status(409).json({ error: 'Bulk status changes are disabled; transition each bid through the audited lifecycle endpoint.' });
});

// Get all bids (with pagination & search)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = { tenantId: req.user!.tenantId };
    if (req.query.status) where.status = req.query.status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        include: {
          vendor: true,
          product: true,
          counterOffers: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bid.count({ where }),
    ]);

    return res.json({ success: true, data: bids, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bids' });
  }
});

// Create a new bid
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, budget, proposedAmount, proposedTimeline, vendorId, productId } = req.body;
    const amount = Number(proposedAmount ?? budget);

    if (!title || !description || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Title, description, and a positive proposed amount are required' });
    }
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required' });
    }
    const tenantId = req.user!.tenantId;
    const vendor = await prisma.vendor.findUnique({ where: { id_tenantId: { id: vendorId, tenantId } } });
    if (!vendor || !vendor.isActive) return res.status(404).json({ success: false, message: 'Active vendor not found' });
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id_tenantId: { id: productId, tenantId } } });
      if (!product || product.vendorId !== vendorId) return res.status(400).json({ success: false, message: 'Product must belong to the selected vendor and tenant' });
    }

    const bid = await prisma.bid.create({
      data: {
        title, description, proposedAmount: amount, proposedTimeline: proposedTimeline ? Number(proposedTimeline) : null,
        status: 'SUBMITTED', submittedAt: new Date(), vendorId, productId: productId || null, tenantId,
      },
      include: { vendor: true, product: true, counterOffers: { orderBy: { createdAt: 'desc' } } }
    });

    return res.status(201).json({ success: true, data: bid, message: 'Bid created successfully' });
  } catch (error) {
    console.error('Error creating bid:', error);
    return res.status(500).json({ success: false, message: 'Failed to create bid' });
  }
});

// Update bid status
router.patch('/:id/status', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER', 'EVALUATOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const current = await prisma.bid.findUnique({ where: { id_tenantId: { id, tenantId: req.user!.tenantId } } });
    if (!current) return res.status(404).json({ success: false, message: 'Bid not found' });
    const transitions: Record<string, string[]> = { SUBMITTED: ['UNDER_EVALUATION', 'REJECTED'], UNDER_EVALUATION: ['EVALUATED', 'REJECTED'], EVALUATED: ['AWARDED', 'REJECTED'] };
    if (!transitions[current.status]?.includes(status)) return res.status(409).json({ success: false, message: 'Invalid bid status transition' });
    const bid = await prisma.bid.update({
      where: { id_tenantId: { id, tenantId: req.user!.tenantId } },
      data: { status, ...(status === 'EVALUATED' ? { evaluatedAt: new Date() } : {}) },
      include: { vendor: true, product: true, counterOffers: { orderBy: { createdAt: 'desc' } } }
    });
    return res.json({ success: true, data: bid });
  } catch (error) {
    console.error('Error updating bid status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update bid status' });
  }
});

// Delete bid
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.bid.deleteMany({ where: { id, tenantId: req.user!.tenantId } });
    if (!result.count) return res.status(404).json({ success: false, message: 'Bid not found' });
    return res.json({ success: true, message: 'Bid deleted successfully' });
  } catch (error) {
    console.error('Error deleting bid:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete bid' });
  }
});

export const bidRoutes = router;
