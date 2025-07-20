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
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids'
    });
  }
});

// ... rest of the routes remain unchanged ...
