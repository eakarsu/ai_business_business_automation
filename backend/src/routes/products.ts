import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = Router();
const prisma = new PrismaClient();

// Get all products for a vendor
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { vendorId } = req.query;
    
    let products;
    if (vendorId) {
      products = await prisma.product.findMany({
        where: { vendorId: vendorId as string },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      products = await prisma.product.findMany({
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get a specific product
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      vendorId,
      name,
      description,
      category,
      subcategory,
      sku,
      manufacturer,
      model,
      unitPrice,
      minOrderQty,
      maxOrderQty,
      currency,
      specifications,
      dimensions,
      weight,
      certifications,
      isActive,
      inStock,
      stockQuantity,
      leadTime,
      complianceStandards,
      qualityRatings
    } = req.body;

    // Validate required fields
    if (!vendorId || !name || !category) {
      return res.status(400).json({ error: 'Vendor ID, name, and category are required' });
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const product = await prisma.product.create({
      data: {
        vendorId,
        name,
        description,
        category,
        subcategory,
        sku,
        manufacturer,
        model,
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
        qualityRatings: qualityRatings || {}
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const {
      name,
      description,
      category,
      subcategory,
      sku,
      manufacturer,
      model,
      unitPrice,
      minOrderQty,
      maxOrderQty,
      currency,
      specifications,
      dimensions,
      weight,
      certifications,
      isActive,
      inStock,
      stockQuantity,
      leadTime,
      complianceStandards,
      qualityRatings
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        category,
        subcategory,
        sku,
        manufacturer,
        model,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        minOrderQty: minOrderQty ? parseInt(minOrderQty) : null,
        maxOrderQty: maxOrderQty ? parseInt(maxOrderQty) : null,
        currency,
        specifications: specifications || {},
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
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;