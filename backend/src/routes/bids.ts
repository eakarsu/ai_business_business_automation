import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { sendCSV, sendPDFReport, paginationMeta } from '../lib/exportUtils';

const router = express.Router();

// Export CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({ include: { vendor: true, product: true }, orderBy: { submittedAt: 'desc' } });
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
router.get('/export/pdf', authenticateToken, async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({ include: { vendor: true, product: true }, orderBy: { submittedAt: 'desc' } });
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
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.bid.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} bids deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete bids' });
  }
});

// Bulk update
router.put('/bulk', authenticateToken, async (req, res) => {
  try {
    const { ids, data } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !data) {
      return res.status(400).json({ error: 'ids array and data are required' });
    }
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;

    const result = await prisma.bid.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} bids updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update bids' });
  }
});

// Get all bids (with pagination & search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, budget, deadline, vendorId, productId, status = 'SUBMITTED' } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({ success: false, message: 'Title, description, and budget are required' });
    }
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required' });
    }
    if (!productId || productId === '' || productId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const bid = await prisma.bid.create({
      data: {
        title, description, proposedAmount: parseFloat(budget), status,
        submittedAt: new Date(), vendorId, productId,
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
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bid = await prisma.bid.update({
      where: { id },
      data: { status },
      include: { vendor: true, product: true, counterOffers: { orderBy: { createdAt: 'desc' } } }
    });
    return res.json({ success: true, data: bid });
  } catch (error) {
    console.error('Error updating bid status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update bid status' });
  }
});

// Delete bid
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bid.delete({ where: { id } });
    return res.json({ success: true, message: 'Bid deleted successfully' });
  } catch (error) {
    console.error('Error deleting bid:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete bid' });
  }
});

export const bidRoutes = router;
