import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AIService } from '../services/aiService';

const router = express.Router();
const prisma = new PrismaClient();

// Get all bids
router.get('/', async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      include: {
        vendor: true,
        counterOffers: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        product: true  // Added product include
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    return res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bids'
    });
  }
});

// Create a new bid
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      vendorId,
      productId,
      status = 'SUBMITTED'
    } = req.body;

    // Log incoming data for debugging
    console.log('Bid creation request body:', req.body);
    console.log('ProductId received:', productId);

    // Validate required fields
    if (!title || !description || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and budget are required'
      });
    }

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    if (!productId || productId === '' || productId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Create the bid with product linkage
    const bid = await prisma.bid.create({
      data: {
        title,
        description,
        proposedAmount: parseFloat(budget),
        status,
        submittedAt: new Date(),
        vendorId: vendorId,
        productId: productId,
      },
      include: {
        vendor: true,
        product: true,
        counterOffers: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: bid,
      message: 'Bid created successfully'
    });
  } catch (error) {
    console.error('Error creating bid:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create bid'
    });
  }
});

// Update bid status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bid = await prisma.bid.update({
      where: { id: id },
      data: { status },
      include: {
        vendor: true,
        product: true,
        counterOffers: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.json({
      success: true,
      data: bid
    });
  } catch (error) {
    console.error('Error updating bid status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update bid status'
    });
  }
});

// Delete bid
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.bid.delete({
      where: { id: id }
    });

    return res.json({
      success: true,
      message: 'Bid deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bid:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bid'
    });
  }
});

export const bidRoutes = router; // Change to named export
