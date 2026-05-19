import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// GET /api/analytics/vendors/:id/performance
router.get('/vendors/:id/performance', async (req: AuthRequest, res) => {
  try {
    const vendorId = req.params['id'] as string;
    const { period = '12' } = req.query; // months
    const periodMonths = parseInt(period as string) || 12;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        overallScore: true,
        financialScore: true,
        technicalScore: true,
        complianceScore: true,
        experienceScore: true,
        riskLevel: true,
        qualificationStatus: true
      }
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - periodMonths);

    // Pagination for bids and compliance checks to avoid OOM on large datasets
    const bidPage = parseInt(req.query.bidPage as string) || 1;
    const bidLimit = Math.min(parseInt(req.query.bidLimit as string) || 100, 500);

    const [bids, evaluations, complianceChecks, contracts] = await Promise.all([
      prisma.bid.findMany({
        where: { vendorId: vendorId, submittedAt: { gte: cutoff } },
        take: bidLimit,
        skip: (bidPage - 1) * bidLimit,
        select: {
          id: true,
          status: true,
          proposedAmount: true,
          submittedAt: true,
          overallScore: true,
          technicalScore: true,
          costScore: true,
          timelineScore: true,
          riskScore: true
        },
        orderBy: { submittedAt: 'asc' }
      }),
      prisma.vendorEvaluation.findMany({
        where: { vendorId: vendorId, evaluatedAt: { gte: cutoff } },
        select: {
          overallScore: true,
          riskLevel: true,
          strengths: true,
          weaknesses: true,
          recommendations: true,
          evaluatedAt: true
        },
        orderBy: { evaluatedAt: 'desc' }
      }),
      prisma.complianceCheck.findMany({
        where: { vendorId: vendorId, checkedAt: { gte: cutoff } },
        select: {
          checkResult: true,
          complianceScore: true,
          regulationType: true,
          regulationName: true,
          checkedAt: true
        },
        orderBy: { checkedAt: 'asc' }
      }),
      prisma.contract.findMany({
        where: { vendorId: vendorId },
        select: {
          totalValue: true,
          currency: true,
          status: true,
          startDate: true,
          endDate: true,
          category: true
        }
      })
    ]);

    // Bid win/loss rates
    const totalBids = bids.length;
    const awardedBids = bids.filter(b => b.status === 'AWARDED').length;
    const rejectedBids = bids.filter(b => b.status === 'REJECTED').length;
    const pendingBids = totalBids - awardedBids - rejectedBids;
    const winRate = totalBids > 0 ? (awardedBids / totalBids) * 100 : 0;

    // Average bid scores
    const bidsWithScore = bids.filter(b => b.overallScore !== null);
    const avgBidScore = bidsWithScore.length > 0
      ? bidsWithScore.reduce((s, b) => s + (b.overallScore ?? 0), 0) / bidsWithScore.length
      : null;

    // Bid scores over time (for trend chart)
    const bidScoreTimeline = bids
      .filter(b => b.overallScore !== null)
      .map(b => ({
        date: b.submittedAt,
        score: b.overallScore,
        status: b.status,
        amount: b.proposedAmount
      }));

    // Compliance summary
    const totalChecks = complianceChecks.length;
    const compliantChecks = complianceChecks.filter(c => c.checkResult === 'COMPLIANT').length;
    const complianceRate = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : null;
    const avgComplianceScore = totalChecks > 0
      ? complianceChecks.reduce((s, c) => s + c.complianceScore, 0) / totalChecks
      : null;

    const complianceByType = complianceChecks.reduce((acc, c) => {
      const key = c.regulationType;
      if (!acc[key]) {
        acc[key] = { total: 0, compliant: 0, avgScore: 0, scores: [] as number[] };
      }
      const entry = acc[key]!;
      entry.total++;
      if (c.checkResult === 'COMPLIANT') entry.compliant++;
      entry.scores.push(c.complianceScore);
      return acc;
    }, {} as Record<string, { total: number; compliant: number; avgScore: number; scores: number[] }>);

    for (const type of Object.keys(complianceByType)) {
      const entry = complianceByType[type]!;
      entry.avgScore = entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;
    }

    // Spend over time (from contracts)
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
    const totalContractValue = contracts.reduce((s, c) => s + c.totalValue, 0);
    const activeContractValue = activeContracts.reduce((s, c) => s + c.totalValue, 0);

    const spendByCategory = contracts.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] ?? 0) + c.totalValue;
      return acc;
    }, {} as Record<string, number>);

    // Evaluation trends
    const latestEvaluation = evaluations[0] ?? null;
    const evalScoreTrend = evaluations.map(e => ({
      date: e.evaluatedAt,
      score: e.overallScore,
      riskLevel: e.riskLevel
    })).reverse();

    return res.json({
      success: true,
      data: {
        vendor,
        period: { months: periodMonths, from: cutoff, to: new Date() },
        bidPerformance: {
          total: totalBids,
          awarded: awardedBids,
          rejected: rejectedBids,
          pending: pendingBids,
          winRate: parseFloat(winRate.toFixed(2)),
          avgScore: avgBidScore !== null ? parseFloat(avgBidScore.toFixed(2)) : null,
          timeline: bidScoreTimeline
        },
        compliancePerformance: {
          total: totalChecks,
          compliant: compliantChecks,
          complianceRate: complianceRate !== null ? parseFloat(complianceRate.toFixed(2)) : null,
          avgScore: avgComplianceScore !== null ? parseFloat(avgComplianceScore.toFixed(2)) : null,
          byRegulationType: complianceByType
        },
        spend: {
          totalContractValue,
          activeContractValue,
          contractCount: contracts.length,
          activeContractCount: activeContracts.length,
          byCategory: spendByCategory
        },
        evaluationHistory: {
          count: evaluations.length,
          latest: latestEvaluation,
          scoreTrend: evalScoreTrend,
          commonStrengths: latestEvaluation?.strengths ?? [],
          commonWeaknesses: latestEvaluation?.weaknesses ?? [],
          topRecommendations: latestEvaluation?.recommendations?.slice(0, 5) ?? []
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendor performance:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch vendor performance analytics' });
  }
});

export default router;
