import express from 'express';

const router = express.Router();

// Mock compliance data
const complianceRecords = [
  {
    id: 1,
    vendorId: 1,
    bidId: 1,
    status: 'compliant',
    requirements: [
      { name: 'Tax Compliance', status: 'verified', date: '2024-01-15' },
      { name: 'Insurance Coverage', status: 'verified', date: '2024-01-20' },
      { name: 'Quality Certification', status: 'pending', date: null }
    ],
    notes: 'All major requirements met',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    vendorId: 2,
    bidId: 2,
    status: 'pending',
    requirements: [
      { name: 'Tax Compliance', status: 'verified', date: '2024-02-01' },
      { name: 'Insurance Coverage', status: 'pending', date: null },
      { name: 'Quality Certification', status: 'pending', date: null }
    ],
    notes: 'Awaiting insurance documentation',
    createdAt: new Date().toISOString()
  }
];

// Get all compliance records
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: complianceRecords
  });
});

// Get compliance record by ID
router.get('/:id', (req, res) => {
  const record = complianceRecords.find(r => r.id === parseInt(req.params.id));
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }

  return res.json({
    success: true,
    data: record
  });
});

// Get compliance records by vendor ID
router.get('/vendor/:vendorId', (req, res) => {
  const vendorRecords = complianceRecords.filter(r => r.vendorId === parseInt(req.params.vendorId));
  
  res.json({
    success: true,
    data: vendorRecords
  });
});

// Get compliance records by bid ID
router.get('/bid/:bidId', (req, res) => {
  const bidRecords = complianceRecords.filter(r => r.bidId === parseInt(req.params.bidId));
  
  res.json({
    success: true,
    data: bidRecords
  });
});

// Create new compliance record
router.post('/', (req, res) => {
  const { vendorId, bidId, status, requirements, notes } = req.body;

  if (!vendorId || !bidId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Vendor ID, bid ID, and status are required'
    });
  }

  const newRecord = {
    id: complianceRecords.length + 1,
    vendorId: parseInt(vendorId),
    bidId: parseInt(bidId),
    status,
    requirements: requirements || [],
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  complianceRecords.push(newRecord);

  return res.status(201).json({
    success: true,
    data: newRecord
  });
});

// Update compliance record
router.put('/:id', (req, res) => {
  const recordIndex = complianceRecords.findIndex(r => r.id === parseInt(req.params.id));
  
  if (recordIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }

  const { status, requirements, notes } = req.body;
  const currentRecord = complianceRecords[recordIndex];
  
  if (!currentRecord) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  complianceRecords[recordIndex] = {
    ...currentRecord,
    status: status || currentRecord.status,
    requirements: requirements || currentRecord.requirements,
    notes: notes !== undefined ? notes : currentRecord.notes
  };

  return res.json({
    success: true,
    data: complianceRecords[recordIndex]
  });
});

// Delete compliance record
router.delete('/:id', (req, res) => {
  const recordIndex = complianceRecords.findIndex(r => r.id === parseInt(req.params.id));
  
  if (recordIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }

  complianceRecords.splice(recordIndex, 1);

  return res.json({
    success: true,
    message: 'Compliance record deleted successfully'
  });
});

// Get compliance checks (formatted for frontend)
router.get('/checks', (req, res) => {
  const checks = complianceRecords.map(record => ({
    id: record.id,
    title: `Compliance Check for ${record.vendorId}`,
    category: record.requirements[0]?.name || 'General',
    status: record.status === 'compliant' ? 'passed' : record.status === 'pending' ? 'pending' : 'failed',
    last_check: record.createdAt,
    description: record.notes || 'Compliance verification',
    severity: record.status === 'compliant' ? 'low' : 'medium',
    vendor_id: record.vendorId,
    vendor_name: `Vendor ${record.vendorId}`
  }));

  res.json({
    checks
  });
});

// Create compliance check
router.post('/checks', (req, res) => {
  const { title, category, description, severity, vendor_name } = req.body;

  if (!title || !category) {
    return res.status(400).json({
      success: false,
      message: 'Title and category are required'
    });
  }

  const newCheck = {
    id: complianceRecords.length + 1,
    vendorId: Math.floor(Math.random() * 100) + 1,
    bidId: Math.floor(Math.random() * 100) + 1,
    status: 'pending',
    requirements: [
      { name: category, status: 'pending', date: null }
    ],
    notes: description || '',
    createdAt: new Date().toISOString()
  };

  complianceRecords.push(newCheck);

  const responseCheck = {
    id: newCheck.id,
    title,
    category,
    status: 'pending',
    last_check: newCheck.createdAt,
    description: description || '',
    severity: severity || 'medium',
    vendor_id: newCheck.vendorId,
    vendor_name: vendor_name || `Vendor ${newCheck.vendorId}`
  };

  return res.status(201).json({
    success: true,
    data: responseCheck
  });
});

// Update compliance check status
router.put('/checks/:id', (req, res) => {
  const checkId = parseInt(req.params.id);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const recordIndex = complianceRecords.findIndex(r => r.id === checkId);
  
  if (recordIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Compliance check not found'
    });
  }

  const mappedStatus = status === 'passed' ? 'compliant' : status === 'failed' ? 'non_compliant' : 'pending';
  if (complianceRecords[recordIndex]) {
    complianceRecords[recordIndex].status = mappedStatus;
  }

  return res.json({
    success: true,
    message: 'Compliance check updated successfully'
  });
});

// Get compliance statistics
router.get('/stats', (req, res) => {
  const totalChecks = complianceRecords.length;
  const passedChecks = complianceRecords.filter(r => r.status === 'compliant').length;
  const failedChecks = complianceRecords.filter(r => r.status === 'non_compliant').length;
  const pendingChecks = complianceRecords.filter(r => r.status === 'pending').length;
  const warningChecks = 0; // No warnings in current data structure
  
  const complianceScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  const criticalIssues = complianceRecords.filter(r => 
    r.status === 'non_compliant' && r.requirements.some(req => req.status === 'failed')
  ).length;

  res.json({
    total_checks: totalChecks,
    passed: passedChecks,
    failed: failedChecks,
    pending: pendingChecks,
    warnings: warningChecks,
    compliance_score: complianceScore,
    critical_issues: criticalIssues
  });
});

export default router;