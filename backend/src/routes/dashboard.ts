import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get real dashboard data from database
const getDashboardStats = async () => {
  try {
    // Get vendor counts
    const totalVendors = await prisma.vendor.count();
    const activeVendors = await prisma.vendor.count({
      where: { isActive: true }
    });

    // Get bid counts
    const totalBids = await prisma.bid.count();
    const activeBids = await prisma.bid.count({
      where: { status: 'SUBMITTED' }
    });
    const completedBids = await prisma.bid.count({
      where: { status: 'EVALUATED' }
    });

    // Get compliance pending count
    const pendingCompliance = await prisma.complianceCheck.count({
      where: { checkResult: 'REQUIRES_REVIEW' }
    });

    // Calculate monthly spending from completed bids
    const completedBidsWithAmount = await prisma.bid.findMany({
      where: { 
        status: 'EVALUATED',
        proposedAmount: { not: null }
      },
      select: { proposedAmount: true }
    });

    const totalSpend = completedBidsWithAmount.reduce((sum, bid) => 
      sum + (bid.proposedAmount || 0), 0
    );

    // Calculate average bid value
    const avgBidValue = totalBids > 0 ? Math.round(totalSpend / totalBids) : 0;

    // Get recent activity
    const recentBids = await prisma.bid.findMany({
      take: 2,
      orderBy: { submittedAt: 'desc' },
      include: { vendor: true }
    });

    const recentVendors = await prisma.vendor.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' }
    });

    const recentActivity = [
      ...recentBids.map(bid => ({
        id: bid.id,
        type: 'bid_created',
        message: `New bid for ${bid.title}`,
        timestamp: bid.submittedAt.toISOString()
      })),
      ...recentVendors.map(vendor => ({
        id: vendor.id,
        type: 'vendor_registered',
        message: `New vendor ${vendor.name} registered`,
        timestamp: vendor.createdAt.toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3);

    // Calculate compliance score as percentage of compliant checks
    const totalComplianceChecks = await prisma.complianceCheck.count();
    const compliantChecks = await prisma.complianceCheck.count({
      where: { checkResult: 'COMPLIANT' }
    });
    const complianceScore = totalComplianceChecks > 0 ? 
      Math.round((compliantChecks / totalComplianceChecks) * 100) : 85;

    return {
      totalBids,
      activeBids,
      completedBids,
      totalVendors,
      activeVendors,
      pendingCompliance,
      totalSpend,
      avgBidValue,
      complianceScore,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data if database query fails
    return {
      totalBids: 0,
      activeBids: 0,
      completedBids: 0,
      totalVendors: 0,
      activeVendors: 0,
      pendingCompliance: 0,
      totalSpend: 0,
      avgBidValue: 0,
      complianceScore: 0,
      recentActivity: []
    };
  }
};

// Get dashboard overview
router.get('/', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Get dashboard statistics (formatted for frontend)
router.get('/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    
    res.json({
      totalVendors: stats.totalVendors,
      activeBids: stats.activeBids,
      pendingApprovals: stats.pendingCompliance,
      completedProcurements: stats.completedBids,
      monthlySpending: stats.totalSpend,
      complianceScore: stats.complianceScore
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      totalVendors: 0,
      activeBids: 0,
      pendingApprovals: 0,
      completedProcurements: 0,
      monthlySpending: 0,
      complianceScore: 0
    });
  }
});

// Get bid statistics
router.get('/bids', (req, res) => {
  const bidStats = {
    total: 15,
    active: 8,
    completed: 7,
    draft: 2,
    cancelled: 1,
    byStatus: {
      open: 5,
      in_progress: 3,
      completed: 7
    },
    byMonth: [
      { month: 'Jan', count: 2 },
      { month: 'Feb', count: 3 },
      { month: 'Mar', count: 4 },
      { month: 'Apr', count: 3 },
      { month: 'May', count: 3 }
    ]
  };

  res.json({
    success: true,
    data: bidStats
  });
});

// Get vendor statistics
router.get('/vendors', (req, res) => {
  const vendorStats = {
    total: 25,
    active: 18,
    inactive: 7,
    byCompliance: {
      compliant: 15,
      pending: 3,
      non_compliant: 7
    },
    topVendors: [
      { name: 'Tech Solutions Inc.', bidsWon: 5, totalValue: 250000 },
      { name: 'Global Supply Co.', bidsWon: 3, totalValue: 150000 },
      { name: 'Innovation Corp.', bidsWon: 2, totalValue: 100000 }
    ]
  };

  res.json({
    success: true,
    data: vendorStats
  });
});

// Get compliance statistics
router.get('/compliance', (req, res) => {
  const complianceStats = {
    totalRecords: 20,
    compliant: 12,
    pending: 5,
    non_compliant: 3,
    byRequirement: {
      'Tax Compliance': { compliant: 18, pending: 2 },
      'Insurance Coverage': { compliant: 15, pending: 5 },
      'Quality Certification': { compliant: 12, pending: 8 }
    },
    recentUpdates: [
      {
        vendorName: 'Tech Solutions Inc.',
        status: 'compliant',
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        vendorName: 'Global Supply Co.',
        status: 'pending',
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      }
    ]
  };

  res.json({
    success: true,
    data: complianceStats
  });
});

// Get financial overview
router.get('/financial', (req, res) => {
  const financialStats = {
    totalSpend: 750000,
    budgetUtilization: 75,
    avgBidValue: 50000,
    savingsAchieved: 125000,
    spendByCategory: [
      { category: 'Software Development', amount: 300000 },
      { category: 'Infrastructure', amount: 200000 },
      { category: 'Consulting', amount: 150000 },
      { category: 'Maintenance', amount: 100000 }
    ],
    monthlySpend: [
      { month: 'Jan', amount: 120000 },
      { month: 'Feb', amount: 150000 },
      { month: 'Mar', amount: 180000 },
      { month: 'Apr', amount: 140000 },
      { month: 'May', amount: 160000 }
    ]
  };

  res.json({
    success: true,
    data: financialStats
  });
});

export default router;