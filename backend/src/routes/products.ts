import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { sendCSV, sendPDFReport, paginationMeta } from '../lib/exportUtils';

const router = Router();

// Export CSV
router.get('/export/csv', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const products = await prisma.product.findMany({ where: { tenantId: req.user!.tenantId }, include: { vendor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    const flat = products.map(p => ({ ...p, vendorName: p.vendor?.name }));
    sendCSV(res, flat, 'products.csv', [
      { key: 'name', label: 'Name' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'unitPrice', label: 'Unit Price' },
      { key: 'currency', label: 'Currency' },
      { key: 'isActive', label: 'Active' },
      { key: 'inStock', label: 'In Stock' },
      { key: 'stockQuantity', label: 'Stock Qty' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

// Export PDF
router.get('/export/pdf', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const products = await prisma.product.findMany({ where: { tenantId: req.user!.tenantId }, include: { vendor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    const flat = products.map(p => ({ ...p, vendorName: p.vendor?.name }));
    sendPDFReport(res, 'Products Report', flat, [
      { key: 'name', label: 'Name' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'unitPrice', label: 'Unit Price' },
      { key: 'isActive', label: 'Active' },
    ]);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

// Bulk delete
router.delete('/bulk', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await prisma.product.deleteMany({ where: { id: { in: ids }, tenantId: req.user!.tenantId } });
    return res.json({ message: `${result.count} products deleted`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete products' });
  }
});

// Bulk update
router.put('/bulk', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { ids, data } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !data) {
      return res.status(400).json({ error: 'ids array and data are required' });
    }
    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.inStock !== undefined) updateData.inStock = data.inStock;

    const result = await prisma.product.updateMany({ where: { id: { in: ids }, tenantId: req.user!.tenantId }, data: updateData });
    return res.json({ message: `${result.count} products updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Failed to bulk update products' });
  }
});

// Get all products (with pagination & search)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const vendorId = req.query.vendorId as string;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: req.user!.tenantId };
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { vendor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, ...paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get a specific product
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id_tenantId: { id, tenantId: req.user!.tenantId } },
      include: { vendor: { select: { id: true, name: true, email: true, phone: true, website: true } } }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product
router.post('/', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { vendorId, name, description, category, subcategory, sku, manufacturer, model, unitPrice, minOrderQty, maxOrderQty, currency, specifications, dimensions, weight, certifications, isActive, inStock, stockQuantity, leadTime, complianceStandards, qualityRatings } = req.body;

    if (!vendorId || !name || !category) {
      return res.status(400).json({ error: 'Vendor ID, name, and category are required' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id_tenantId: { id: vendorId, tenantId: req.user!.tenantId } } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const product = await prisma.product.create({
      data: {
        vendorId, name, description, category, subcategory, sku, manufacturer, model,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        minOrderQty: minOrderQty ? parseInt(minOrderQty) : null,
        maxOrderQty: maxOrderQty ? parseInt(maxOrderQty) : null,
        currency: currency || 'USD',
        specifications: specifications || {},
        dimensions: dimensions || {},
        weight: weight ? parseFloat(weight) : null,
        certifications: certifications || [],
        isActive: isActive !== undefined ? isActive : true,
        inStock: inStock !== undefined ? inStock : true,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        leadTime: leadTime ? parseInt(leadTime) : null,
        complianceStandards: complianceStandards || [],
        qualityRatings: qualityRatings || {},
        tenantId: req.user!.tenantId
      },
      include: { vendor: { select: { id: true, name: true, email: true } } }
    });
    return res.status(201).json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/:id', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, subcategory, sku, manufacturer, model, unitPrice, minOrderQty, maxOrderQty, currency, specifications, dimensions, weight, certifications, isActive, inStock, stockQuantity, leadTime, complianceStandards, qualityRatings } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id_tenantId: { id, tenantId: req.user!.tenantId } } });
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    const product = await prisma.product.update({
      where: { id_tenantId: { id, tenantId: req.user!.tenantId } },
      data: {
        name, description, category, subcategory, sku, manufacturer, model,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        minOrderQty: minOrderQty ? parseInt(minOrderQty) : null,
        maxOrderQty: maxOrderQty ? parseInt(maxOrderQty) : null,
        currency, specifications: specifications || {},
        dimensions: dimensions || {},
        weight: weight ? parseFloat(weight) : null,
        certifications: certifications || [],
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
        inStock: inStock !== undefined ? inStock : existingProduct.inStock,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        leadTime: leadTime ? parseInt(leadTime) : null,
        complianceStandards: complianceStandards || [],
        qualityRatings: qualityRatings || {}
      },
      include: { vendor: { select: { id: true, name: true, email: true } } }
    });
    return res.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'PROCUREMENT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({ where: { id_tenantId: { id, tenantId: req.user!.tenantId } } });
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    await prisma.product.delete({ where: { id_tenantId: { id, tenantId: req.user!.tenantId } } });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
