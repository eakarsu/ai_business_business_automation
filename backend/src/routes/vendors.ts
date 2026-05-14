import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendCSV, sendPDFReport, paginationMeta } from '../lib/exportUtils';

const router = Router();

// Export CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
    sendCSV(res, vendors, 'vendors.csv', [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'businessType', label: 'Business Type' },
      { key: 'industryType', label: 'Industry' },
      { key: 'qualificationStatus', label: 'Status' },
      { key: 'isActive', label: 'Active' },
      { key: 'createdAt', label: 'Created' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export vendors' });
  }
});

// Export PDF
router.get('/export/pdf', authenticateToken, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
    sendPDFReport(res, 'Vendors Report', vendors, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'businessType', label: 'Business Type' },
      { key: 'qualificationStatus', label: 'Status' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export vendors' });
  }
});

// Bulk delete
router.delete('/bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.vendor.deleteMany({ where: { id: { in: ids } } });
    return res.json({ message: `${result.count} vendors deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete vendors' });
  }
});

// Bulk update
router.put('/bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, data } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !data) {
      return res.status(400).json({ error: 'ids array and data are required' });
    }
    const { qualificationStatus, isActive } = data;
    const updateData: any = {};
    if (qualificationStatus !== undefined) updateData.qualificationStatus = qualificationStatus;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await prisma.vendor.updateMany({ where: { id: { in: ids } }, data: updateData });
    return res.json({ message: `${result.count} vendors updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update vendors' });
  }
});

// Get all vendors (with pagination & search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessType: { contains: search, mode: 'insensitive' } },
        { industryType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, website: true,
          address: true, businessType: true, industryType: true,
          qualificationStatus: true, isActive: true, createdAt: true,
          _count: { select: { products: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({ vendors, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get vendor by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, name: true, category: true, unitPrice: true, currency: true, isActive: true, inStock: true }
        }
      }
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    return res.json({ vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Create new vendor
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, website, address, businessType, industryType } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!req.user?.id) return res.status(401).json({ error: 'User authentication required' });

    const vendor = await prisma.vendor.create({
      data: { name, email, phone, website, address, businessType, industryType, createdById: req.user.id }
    });
    return res.status(201).json({ vendor });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, website, address, businessType, industryType, qualificationStatus, isActive } = req.body;

    const existingVendor = await prisma.vendor.findUnique({ where: { id } });
    if (!existingVendor) return res.status(404).json({ error: 'Vendor not found' });

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { name, email, phone, website, address, businessType, industryType, qualificationStatus, isActive }
    });
    return res.json({ vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Delete vendor
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingVendor = await prisma.vendor.findUnique({ where: { id } });
    if (!existingVendor) return res.status(404).json({ error: 'Vendor not found' });

    await prisma.vendor.delete({ where: { id } });
    return res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

export default router;
