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
        }
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

// Get bid by ID
router.get('/:id', async (req, res) => {
  try {
    const bid = await prisma.bid.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        counterOffers: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    return res.json({
      success: true,
      data: bid
    });
  } catch (error) {
    console.error('Error fetching bid:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bid'
    });
  }
});

// Create new bid
router.post('/', async (req, res) => {
  try {
    const { title, description, budget, vendorId } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and budget are required'
      });
    }

    const newBid = await prisma.bid.create({
      data: {
        title,
        description,
        proposedAmount: parseFloat(budget),
        vendorId: vendorId || null,
        status: 'SUBMITTED'
      },
      include: {
        vendor: true
      }
    });

    return res.status(201).json({
      success: true,
      data: newBid
    });
  } catch (error) {
    console.error('Error creating bid:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create bid'
    });
  }
});

// Update bid
router.put('/:id', async (req, res) => {
  try {
    const { title, description, budget, status, vendorId } = req.body;
    
    const existingBid = await prisma.bid.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingBid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }
    
    const updatedBid = await prisma.bid.update({
      where: { id: req.params.id },
      data: {
        title: title || existingBid.title,
        description: description || existingBid.description,
        proposedAmount: budget ? parseFloat(budget) : existingBid.proposedAmount,
        status: status || existingBid.status,
        vendorId: vendorId !== undefined ? vendorId : existingBid.vendorId
      },
      include: {
        vendor: true
      }
    });

    return res.json({
      success: true,
      data: updatedBid
    });
  } catch (error) {
    console.error('Error updating bid:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update bid'
    });
  }
});

// Delete bid
router.delete('/:id', async (req, res) => {
  try {
    const existingBid = await prisma.bid.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingBid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    await prisma.bid.delete({
      where: { id: req.params.id }
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

// Create counter offer for a bid
router.post('/:id/counter-offer', async (req, res) => {
  try {
    const { proposedAmount, proposedTimeline, modifications, justification, technicalChanges, alternativeApproach, expiresAt, enableAIAnalysis } = req.body;
    const bidId = req.params.id;

    if (!modifications || !justification) {
      return res.status(400).json({
        success: false,
        message: 'Modifications and justification are required'
      });
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { vendor: true }
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.status !== 'UNDER_EVALUATION' && bid.status !== 'EVALUATED') {
      return res.status(400).json({
        success: false,
        message: 'Counter offers can only be made for bids under evaluation or evaluated'
      });
    }

    let aiNegotiationAnalysis = null;

    if (enableAIAnalysis) {
      try {
        const currentTerms = {
          originalAmount: bid.proposedAmount,
          proposedAmount: proposedAmount ? parseFloat(proposedAmount) : bid.proposedAmount,
          timeline: proposedTimeline || null,
          modifications: modifications,
          technicalChanges: technicalChanges || null,
          alternativeApproach: alternativeApproach || null
        };

        const negotiationGoals = {
          costOptimization: proposedAmount && bid.proposedAmount ? (bid.proposedAmount - parseFloat(proposedAmount)) / bid.proposedAmount : 0,
          timelineImprovement: proposedTimeline || null,
          qualityEnhancement: modifications,
          riskMitigation: justification
        };

        const constraints = {
          budgetLimit: bid.proposedAmount ? bid.proposedAmount * 1.1 : null,
          timelineConstraints: proposedTimeline || null,
          technicalRequirements: technicalChanges || null,
          complianceRequirements: 'Standard procurement compliance'
        };

        aiNegotiationAnalysis = await AIService.negotiateTerms(currentTerms, negotiationGoals, constraints);
      } catch (aiError) {
        console.warn('AI negotiation analysis failed:', aiError);
      }
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
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'COUNTER_OFFERED' }
    });

    return res.status(201).json({
      success: true,
      data: {
        counterOffer,
        aiAnalysis: aiNegotiationAnalysis
      }
    });
  } catch (error) {
    console.error('Error creating counter offer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create counter offer'
    });
  }
});

// Get counter offers for a bid
router.get('/:id/counter-offers', async (req, res) => {
  try {
    const counterOffers = await prisma.counterOffer.findMany({
      where: { bidId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: counterOffers
    });
  } catch (error) {
    console.error('Error fetching counter offers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch counter offers'
    });
  }
});

// Respond to counter offer
router.put('/counter-offer/:counterId/respond', async (req, res) => {
  try {
    const { status, response } = req.body;
    const counterId = req.params.counterId;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACCEPTED or REJECTED'
      });
    }

    const counterOffer = await prisma.counterOffer.findUnique({
      where: { id: counterId },
      include: { bid: true }
    });

    if (!counterOffer) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    const updatedCounterOffer = await prisma.counterOffer.update({
      where: { id: counterId },
      data: {
        status,
        respondedAt: new Date()
      }
    });

    let bidStatus = counterOffer.bid.status;
    if (status === 'ACCEPTED') {
      bidStatus = 'AWARDED';
    } else if (status === 'REJECTED') {
      bidStatus = 'REJECTED';
    }

    await prisma.bid.update({
      where: { id: counterOffer.bidId },
      data: { status: bidStatus }
    });

    return res.json({
      success: true,
      data: updatedCounterOffer
    });
  } catch (error) {
    console.error('Error responding to counter offer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to respond to counter offer'
    });
  }
});

export default router;