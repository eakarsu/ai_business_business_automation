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

// Get all vendors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        businessType: true,
        industryType: true,
        qualificationStatus: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get vendor by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            unitPrice: true,
            currency: true,
            isActive: true,
            inStock: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    return res.json({ vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Create new vendor
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      website, 
      address, 
      businessType, 
      industryType 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        email,
        phone,
        website,
        address,
        businessType,
        industryType,
        createdById: req.user.id
      }
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
    const { 
      name, 
      email, 
      phone, 
      website, 
      address, 
      businessType, 
      industryType,
      qualificationStatus,
      isActive 
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        website,
        address,
        businessType,
        industryType,
        qualificationStatus,
        isActive
      }
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

    if (!id) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await prisma.vendor.delete({
      where: { id }
    });

    return res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

export default router;