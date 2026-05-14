import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/counter-offers - Create a counter offer for a bid
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      bidId,
      proposedAmount,
      proposedTimeline,
      modifications,
      justification,
      technicalChanges,
      alternativeApproach,
      expiresAt
    } = req.body;

    if (!bidId || !modifications || !justification) {
      return res.status(400).json({
        success: false,
        error: 'bidId, modifications, and justification are required'
      });
    }

    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    const counterOffer = await prisma.counterOffer.create({
      data: {
        bidId,
        proposedAmount: proposedAmount ? parseFloat(proposedAmount) : null,
        proposedTimeline: proposedTimeline ? parseInt(proposedTimeline) : null,
        modifications,
        justification,
        technicalChanges: technicalChanges || null,
        alternativeApproach: alternativeApproach || null,
        status: 'PENDING',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        bid: {
          select: { id: true, title: true, vendorId: true, proposedAmount: true }
        }
      }
    });

    return res.status(201).json({ success: true, data: counterOffer });
  } catch (error) {
    console.error('Error creating counter offer:', error);
    return res.status(500).json({ success: false, error: 'Failed to create counter offer' });
  }
});

// GET /api/counter-offers?bidId=X - List counter offers (optionally filtered by bid)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { bidId, status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (bidId) where.bidId = bidId as string;
    if (status) where.status = status as string;

    const [counterOffers, total] = await Promise.all([
      prisma.counterOffer.findMany({
        where,
        include: {
          bid: {
            select: {
              id: true,
              title: true,
              proposedAmount: true,
              vendor: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.counterOffer.count({ where })
    ]);

    return res.json({
      success: true,
      data: counterOffers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error listing counter offers:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch counter offers' });
  }
});

// GET /api/counter-offers/:id - Get single counter offer
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const coId = req.params['id'] as string;

    const counterOffer = await prisma.counterOffer.findUnique({
      where: { id: coId },
      include: {
        bid: {
          include: {
            vendor: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!counterOffer) {
      return res.status(404).json({ success: false, error: 'Counter offer not found' });
    }

    return res.json({ success: true, data: counterOffer });
  } catch (error) {
    console.error('Error fetching counter offer:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch counter offer' });
  }
});

// PATCH /api/counter-offers/:id - Accept, reject, or update a counter offer
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const coId = req.params['id'] as string;
    const { status, aiRecommendation, riskAssessment } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }

    const validStatuses = ['ACCEPTED', 'REJECTED', 'UNDER_REVIEW', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existing = await prisma.counterOffer.findUnique({ where: { id: coId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Counter offer not found' });
    }

    if (existing.status !== 'PENDING' && existing.status !== 'UNDER_REVIEW') {
      return res.status(409).json({
        success: false,
        error: `Cannot update a counter offer that is already ${existing.status}`
      });
    }

    const isTerminal = ['ACCEPTED', 'REJECTED'].includes(status);
    const updated = await prisma.counterOffer.update({
      where: { id: coId },
      data: {
        status: status as 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW' | 'EXPIRED',
        ...(isTerminal ? { respondedAt: new Date() } : {}),
        ...(aiRecommendation != null ? { aiRecommendation } : {}),
        ...(riskAssessment != null ? { riskAssessment } : {})
      },
      include: {
        bid: {
          select: { id: true, title: true, vendorId: true }
        }
      }
    });

    // If accepted, update the bid status accordingly
    if (status === 'ACCEPTED') {
      await prisma.bid.update({
        where: { id: existing.bidId },
        data: { status: 'AWARDED' }
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating counter offer:', error);
    return res.status(500).json({ success: false, error: 'Failed to update counter offer' });
  }
});

export default router;
