import express from 'express';

const router = express.Router();

// Mock dashboard data
const getDashboardStats = () => {
  return {
    totalBids: 15,
    activeBids: 8,
    completedBids: 7,
    totalVendors: 25,
    activeVendors: 18,
    pendingCompliance: 3,
    totalSpend: 750000,
    avgBidValue: 50000,
    recentActivity: [
      {
        id: 1,
        type: 'bid_created',
        message: 'New bid for Software Development Services',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 2,
        type: 'vendor_registered',
        message: 'New vendor Tech Solutions Inc. registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 3,
        type: 'compliance_updated',
        message: 'Compliance status updated for Global Supply Co.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ]
  };
};

// Get dashboard overview
router.get('/', (req, res) => {
  const stats = getDashboardStats();
  
  res.json({
    success: true,
    data: stats
  });
});

// Get dashboard statistics (formatted for frontend)
router.get('/stats', (req, res) => {
  const stats = getDashboardStats();
  
  res.json({
    totalVendors: stats.totalVendors,
    activeBids: stats.activeBids,
    pendingApprovals: stats.pendingCompliance,
    completedProcurements: stats.completedBids,
    monthlySpending: stats.totalSpend,
    complianceScore: 85 // Mock compliance score as percentage
  });
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