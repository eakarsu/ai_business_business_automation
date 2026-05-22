import { Router } from 'express';

const router = Router();

router.post('/score', (req, res) => {
  const { spendSharePct = 0, singleSource = false, deliveryDelayDays = 0, contractExitDays = 30, complianceFindings = 0 } = req.body || {};
  const score = Math.min(100, Math.round(
    Number(spendSharePct) * 0.55 +
    (singleSource ? 25 : 0) +
    Math.min(20, Number(deliveryDelayDays) * 2) +
    Math.max(0, 30 - Number(contractExitDays)) * 0.5 +
    Number(complianceFindings) * 8
  ));

  res.json({
    feature: 'supplier_dependency_risk',
    score,
    level: score >= 70 ? 'critical' : score >= 40 ? 'watch' : 'resilient',
    actions: [
      Number(spendSharePct) > 45 && 'Start alternate supplier sourcing for concentrated spend categories.',
      singleSource && 'Document single-source justification and contingency plan.',
      Number(deliveryDelayDays) > 5 && 'Review delivery SLA and expedite clauses.',
      Number(complianceFindings) > 0 && 'Block renewal until open compliance findings are resolved.',
    ].filter(Boolean),
  });
});

export default router;
