// customViews.js - 4 endpoints for added Procurement Views features
// VIZ 1: Vendor comparison data
// VIZ 2: Monthly spend trend by category
// NON-VIZ 1: RFP PDF generator (pdfkit)
// NON-VIZ 2: Spend approval queue (pending POs) + actions

const express = require('express');
const PDFDocument = require('pdfkit');

const router = express.Router();

// --- In-memory mock data so endpoints work without DB churn ---
const VENDORS = [
  { name: 'TechPro Solutions',  price: 78, quality: 92, leadTime: 84, risk: 18 },
  { name: 'GlobalSupply Co',    price: 88, quality: 81, leadTime: 72, risk: 24 },
  { name: 'PrimeVendors Inc',   price: 70, quality: 88, leadTime: 90, risk: 14 },
  { name: 'Acme Industrial',    price: 82, quality: 76, leadTime: 65, risk: 32 },
  { name: 'NextGen Materials',  price: 91, quality: 94, leadTime: 88, risk: 12 },
];

const SPEND_TREND = [
  { month: 'Jan', IT: 120000, Office: 22000, Logistics: 65000, Services: 41000 },
  { month: 'Feb', IT: 138000, Office: 19000, Logistics: 71000, Services: 45000 },
  { month: 'Mar', IT: 152000, Office: 25000, Logistics: 69000, Services: 48000 },
  { month: 'Apr', IT: 144000, Office: 28000, Logistics: 78000, Services: 52000 },
  { month: 'May', IT: 168000, Office: 24000, Logistics: 82000, Services: 50000 },
  { month: 'Jun', IT: 175000, Office: 30000, Logistics: 88000, Services: 56000 },
  { month: 'Jul', IT: 182000, Office: 27000, Logistics: 91000, Services: 58000 },
  { month: 'Aug', IT: 191000, Office: 31000, Logistics: 86000, Services: 61000 },
  { month: 'Sep', IT: 178000, Office: 29000, Logistics: 93000, Services: 63000 },
  { month: 'Oct', IT: 205000, Office: 33000, Logistics: 99000, Services: 67000 },
  { month: 'Nov', IT: 218000, Office: 35000, Logistics: 102000, Services: 71000 },
  { month: 'Dec', IT: 234000, Office: 38000, Logistics: 110000, Services: 76000 },
];

const PENDING_POS = [
  { id: 'PO-1001', vendor: 'TechPro Solutions', category: 'IT',        amount: 48500,  requester: 'M. Chen',    submitted: '2026-05-12', status: 'PENDING', comment: '' },
  { id: 'PO-1002', vendor: 'GlobalSupply Co',   category: 'Logistics', amount: 12200,  requester: 'J. Rivera',  submitted: '2026-05-13', status: 'PENDING', comment: '' },
  { id: 'PO-1003', vendor: 'PrimeVendors Inc',  category: 'Office',    amount: 3450,   requester: 'A. Patel',   submitted: '2026-05-13', status: 'PENDING', comment: '' },
  { id: 'PO-1004', vendor: 'Acme Industrial',   category: 'Services',  amount: 22750,  requester: 'S. Brooks',  submitted: '2026-05-14', status: 'PENDING', comment: '' },
  { id: 'PO-1005', vendor: 'NextGen Materials', category: 'IT',        amount: 91300,  requester: 'D. Nguyen',  submitted: '2026-05-15', status: 'PENDING', comment: '' },
  { id: 'PO-1006', vendor: 'TechPro Solutions', category: 'Services',  amount: 6800,   requester: 'L. Okafor',  submitted: '2026-05-15', status: 'PENDING', comment: '' },
  { id: 'PO-1007', vendor: 'GlobalSupply Co',   category: 'Logistics', amount: 18900,  requester: 'R. Hughes',  submitted: '2026-05-16', status: 'PENDING', comment: '' },
];

// VIZ 1: Vendor comparison
router.get('/vendor-comparison', (req, res) => {
  res.json({
    success: true,
    criteria: ['price', 'quality', 'leadTime', 'risk'],
    vendors: VENDORS,
  });
});

// VIZ 2: Spend trend
router.get('/spend-trend', (req, res) => {
  res.json({
    success: true,
    categories: ['IT', 'Office', 'Logistics', 'Services'],
    series: SPEND_TREND,
  });
});

// NON-VIZ 1: RFP PDF generator
router.post('/rfp-pdf', (req, res) => {
  const {
    category = 'General Goods & Services',
    requirements = [],
    deadline = '',
    title = '',
    issuer = 'AI Procurement Management',
  } = req.body || {};

  const reqList = Array.isArray(requirements)
    ? requirements
    : String(requirements).split('\n').map((s) => s.trim()).filter(Boolean);

  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
  const fname = `RFP_${(title || category).replace(/[^a-z0-9]+/gi, '_')}_${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  doc.pipe(res);

  doc.fontSize(20).text('Request for Proposal (RFP)', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#555').text(`Issued by: ${issuer}`, { align: 'center' });
  doc.moveDown(1.5).fillColor('black');

  doc.fontSize(14).text('1. Overview', { underline: true });
  doc.moveDown(0.3).fontSize(11).text(
    `This Request for Proposal (RFP) is issued for the procurement of goods/services in the "${category}" category. ` +
    `Qualified vendors are invited to submit proposals that demonstrate the ability to meet the requirements outlined below.`
  );
  doc.moveDown(1);

  doc.fontSize(14).text('2. Category', { underline: true });
  doc.moveDown(0.3).fontSize(11).text(category);
  doc.moveDown(1);

  doc.fontSize(14).text('3. Requirements', { underline: true });
  doc.moveDown(0.3).fontSize(11);
  if (reqList.length === 0) {
    doc.text('No specific requirements were supplied.');
  } else {
    reqList.forEach((r, i) => {
      doc.text(`  ${i + 1}. ${r}`);
    });
  }
  doc.moveDown(1);

  doc.fontSize(14).text('4. Submission Deadline', { underline: true });
  doc.moveDown(0.3).fontSize(11).text(deadline || 'TBD');
  doc.moveDown(1);

  doc.fontSize(14).text('5. Evaluation Criteria', { underline: true });
  doc.moveDown(0.3).fontSize(11).list([
    'Price competitiveness',
    'Quality of goods/services',
    'Vendor experience and references',
    'Delivery / lead time',
    'Risk and compliance posture',
  ]);
  doc.moveDown(1);

  doc.fontSize(14).text('6. Contact', { underline: true });
  doc.moveDown(0.3).fontSize(11).text('procurement@company.com');

  doc.moveDown(2);
  doc.fontSize(9).fillColor('#888')
    .text(`Generated by AI Procurement Management on ${new Date().toISOString()}`, { align: 'center' });

  doc.end();
});

// NON-VIZ 2: Spend approval queue
router.get('/approval-queue', (req, res) => {
  res.json({
    success: true,
    pending: PENDING_POS.filter((p) => p.status === 'PENDING'),
    all: PENDING_POS,
  });
});

router.post('/approval-queue/:id/action', (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body || {};
  const po = PENDING_POS.find((p) => p.id === id);
  if (!po) return res.status(404).json({ success: false, error: 'PO not found' });

  const a = String(action || '').toUpperCase();
  if (!['APPROVE', 'REJECT', 'COMMENT'].includes(a)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  if (a === 'APPROVE') po.status = 'APPROVED';
  if (a === 'REJECT')  po.status = 'REJECTED';
  if (comment) po.comment = comment;

  res.json({ success: true, po });
});

module.exports = router;
