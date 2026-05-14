import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Auth applied at router level (also applied at mount point in index.ts for belt-and-suspenders)
router.use(authenticateToken);

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

// Get bid statistics — real DB data
router.get('/bids', async (req, res) => {
  try {
    const [total, active, completed, draft, awarded, rejected] = await Promise.all([
      prisma.bid.count(),
      prisma.bid.count({ where: { status: 'SUBMITTED' } }),
      prisma.bid.count({ where: { status: 'EVALUATED' } }),
      prisma.bid.count({ where: { status: 'DRAFT' } }),
      prisma.bid.count({ where: { status: 'AWARDED' } }),
      prisma.bid.count({ where: { status: 'REJECTED' } }),
    ]);

    // Monthly bids for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentBids = await prisma.bid.findMany({
      where: { submittedAt: { gte: sixMonthsAgo } },
      select: { submittedAt: true },
      orderBy: { submittedAt: 'asc' },
    });
    const byMonth: Record<string, number> = {};
    recentBids.forEach(b => {
      const key = b.submittedAt.toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + 1;
    });

    res.json({ success: true, data: { total, active, completed, draft, awarded, rejected,
      byStatus: { submitted: active, evaluated: completed, draft, awarded, rejected },
      byMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
    }});
  } catch (e) {
    console.error('Dashboard bids error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch bid stats' });
  }
});

// Get vendor statistics — real DB data
router.get('/vendors', async (req, res) => {
  try {
    const [total, active, inactive, qualified, pending, disqualified] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.vendor.count({ where: { isActive: false } }),
      prisma.vendor.count({ where: { qualificationStatus: 'QUALIFIED' } }),
      prisma.vendor.count({ where: { qualificationStatus: 'PENDING' } }),
      prisma.vendor.count({ where: { qualificationStatus: 'DISQUALIFIED' } }),
    ]);

    const topVendors = await prisma.vendor.findMany({
      where: { overallScore: { not: null } },
      orderBy: { overallScore: 'desc' },
      take: 5,
      select: { name: true, overallScore: true, riskLevel: true, qualificationStatus: true },
    });

    res.json({ success: true, data: { total, active, inactive,
      byQualification: { qualified, pending, disqualified },
      topVendors,
    }});
  } catch (e) {
    console.error('Dashboard vendors error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch vendor stats' });
  }
});

// Get compliance statistics — real DB data
router.get('/compliance', async (req, res) => {
  try {
    const records = await prisma.complianceCheck.findMany({
      select: { checkResult: true, complianceScore: true, regulationType: true, checkedAt: true, vendor: { select: { name: true } } },
      orderBy: { checkedAt: 'desc' },
    });

    const total = records.length;
    const compliant = records.filter(r => r.checkResult === 'COMPLIANT').length;
    const nonCompliant = records.filter(r => r.checkResult === 'NON_COMPLIANT').length;
    const pending = records.filter(r => r.checkResult === 'REQUIRES_REVIEW').length;
    const partial = records.filter(r => r.checkResult === 'PARTIALLY_COMPLIANT').length;
    const avgScore = total > 0 ? records.reduce((s, r) => s + r.complianceScore, 0) / total : 0;

    const byType: Record<string, { compliant: number; total: number }> = {};
    records.forEach(r => {
      if (!byType[r.regulationType]) byType[r.regulationType] = { compliant: 0, total: 0 };
      byType[r.regulationType]!.total++;
      if (r.checkResult === 'COMPLIANT') byType[r.regulationType]!.compliant++;
    });

    res.json({ success: true, data: { total, compliant, nonCompliant, pending, partial, avgScore: Math.round(avgScore),
      byType,
      recentUpdates: records.slice(0, 5).map(r => ({ vendorName: r.vendor?.name || 'System', status: r.checkResult, checkedAt: r.checkedAt })),
    }});
  } catch (e) {
    console.error('Dashboard compliance error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance stats' });
  }
});

// Get financial overview — real DB data
router.get('/financial', async (req, res) => {
  try {
    const spendAgg = await prisma.spendRecord.aggregate({ _sum: { amount: true }, _count: true });
    const totalSpend = spendAgg._sum.amount || 0;

    const savingsAgg = await prisma.savingsOpportunity.aggregate({
      _sum: { realizedSavings: true, projectedSavings: true }
    });

    const spendByCategory = await prisma.spendRecord.groupBy({
      by: ['category'], _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: 8,
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRecords = await prisma.spendRecord.findMany({
      where: { transactionDate: { gte: sixMonthsAgo } },
      select: { amount: true, transactionDate: true },
    });
    const byMonth: Record<string, number> = {};
    monthlyRecords.forEach(r => {
      const key = r.transactionDate.toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + r.amount;
    });

    res.json({ success: true, data: {
      totalSpend,
      transactionCount: spendAgg._count,
      savingsAchieved: savingsAgg._sum.realizedSavings || 0,
      projectedSavings: savingsAgg._sum.projectedSavings || 0,
      spendByCategory: spendByCategory.map(s => ({ category: s.category, amount: s._sum.amount || 0 })),
      monthlySpend: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })),
    }});
  } catch (e) {
    console.error('Dashboard financial error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch financial stats' });
  }
});

export default router;