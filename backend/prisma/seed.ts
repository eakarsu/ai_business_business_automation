import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.savingsOpportunity.deleteMany();
  await prisma.spendRecord.deleteMany();
  await prisma.rFP.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.counterOffer.deleteMany();
  await prisma.bidEvaluation.deleteMany();
  await prisma.bidDocument.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendorEvaluation.deleteMany();
  await prisma.complianceCheck.deleteMany();
  await prisma.vendorDocument.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@procurement.com',
      password: await bcrypt.hash('password', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'Procurement',
      organization: 'Government Agency',
    },
  });

  // Create additional users
  const procurementManager = await prisma.user.create({
    data: {
      email: 'manager@procurement.com',
      password: await bcrypt.hash('password', 12),
      firstName: 'John',
      lastName: 'Manager',
      role: 'PROCUREMENT_MANAGER',
      department: 'Procurement',
      organization: 'Government Agency',
    },
  });

  const additionalUsers = [
    { email: 'evaluator1@procurement.com', firstName: 'Sarah', lastName: 'Chen', role: 'EVALUATOR', department: 'Procurement' },
    { email: 'evaluator2@procurement.com', firstName: 'Mike', lastName: 'Johnson', role: 'EVALUATOR', department: 'IT' },
    { email: 'evaluator3@procurement.com', firstName: 'Lisa', lastName: 'Patel', role: 'EVALUATOR', department: 'Finance' },
    { email: 'compliance1@procurement.com', firstName: 'David', lastName: 'Kim', role: 'COMPLIANCE_OFFICER', department: 'Legal' },
    { email: 'compliance2@procurement.com', firstName: 'Rachel', lastName: 'Green', role: 'COMPLIANCE_OFFICER', department: 'Compliance' },
    { email: 'user1@procurement.com', firstName: 'Tom', lastName: 'Wilson', role: 'USER', department: 'Operations' },
    { email: 'user2@procurement.com', firstName: 'Emily', lastName: 'Davis', role: 'USER', department: 'Marketing' },
    { email: 'user3@procurement.com', firstName: 'James', lastName: 'Brown', role: 'USER', department: 'HR' },
    { email: 'pm2@procurement.com', firstName: 'Anna', lastName: 'Martinez', role: 'PROCUREMENT_MANAGER', department: 'Procurement' },
    { email: 'pm3@procurement.com', firstName: 'Robert', lastName: 'Taylor', role: 'PROCUREMENT_MANAGER', department: 'Supply Chain' },
    { email: 'admin2@procurement.com', firstName: 'Jennifer', lastName: 'Lee', role: 'ADMIN', department: 'IT' },
    { email: 'user4@procurement.com', firstName: 'Chris', lastName: 'Anderson', role: 'USER', department: 'Finance' },
    { email: 'evaluator4@procurement.com', firstName: 'Maria', lastName: 'Garcia', role: 'EVALUATOR', department: 'Operations' },
  ];

  const hashedPassword = await bcrypt.hash('password', 12);
  for (const u of additionalUsers) {
    await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        department: u.department,
        organization: 'Government Agency',
      },
    });
  }

  // Create 15+ Vendors
  console.log('Creating vendors...');
  const vendorData = [
    { name: 'TechPro Solutions', regNum: 'REG-TECH-001', email: 'contact@techpro.com', industry: 'Information Technology', revenue: 50000000, score: 85.5, risk: 'LOW' as const },
    { name: 'Office Essentials Inc', regNum: 'REG-OFFICE-002', email: 'sales@officeessentials.com', industry: 'Office Supplies', revenue: 25000000, score: 78.2, risk: 'MEDIUM' as const },
    { name: 'BuildRight Materials', regNum: 'REG-CONST-003', email: 'info@buildright.com', industry: 'Construction', revenue: 75000000, score: 81.7, risk: 'MEDIUM' as const },
    { name: 'Industrial Equipment Solutions', regNum: 'REG-MFG-004', email: 'sales@industrial.com', industry: 'Manufacturing', revenue: 85000000, score: 84.2, risk: 'LOW' as const },
    { name: 'Strategic Advisory Group', regNum: 'REG-CONSULT-005', email: 'contact@strategic.com', industry: 'Consulting', revenue: 35000000, score: 87.5, risk: 'LOW' as const },
    { name: 'MedTech Solutions Inc', regNum: 'REG-HEALTH-006', email: 'info@medtech.com', industry: 'Healthcare', revenue: 120000000, score: 89.3, risk: 'LOW' as const },
    { name: 'Global Logistics Partners', regNum: 'REG-LOG-007', email: 'ops@globallogistics.com', industry: 'Logistics', revenue: 200000000, score: 82.1, risk: 'MEDIUM' as const },
    { name: 'SecureNet Systems', regNum: 'REG-SEC-008', email: 'security@securenet.com', industry: 'Cybersecurity', revenue: 45000000, score: 91.2, risk: 'LOW' as const },
    { name: 'GreenEnergy Corp', regNum: 'REG-ENERGY-009', email: 'info@greenenergy.com', industry: 'Energy', revenue: 150000000, score: 76.8, risk: 'MEDIUM' as const },
    { name: 'DataCloud Services', regNum: 'REG-CLOUD-010', email: 'sales@datacloud.com', industry: 'Cloud Services', revenue: 80000000, score: 88.9, risk: 'LOW' as const },
    { name: 'PrecisionTools Manufacturing', regNum: 'REG-TOOLS-011', email: 'orders@precision.com', industry: 'Manufacturing', revenue: 55000000, score: 79.4, risk: 'MEDIUM' as const },
    { name: 'CleanTech Facilities', regNum: 'REG-CLEAN-012', email: 'service@cleantech.com', industry: 'Facilities Management', revenue: 30000000, score: 74.3, risk: 'MEDIUM' as const },
    { name: 'Digital Marketing Pro', regNum: 'REG-MARKET-013', email: 'hello@digitalmarketing.com', industry: 'Marketing', revenue: 20000000, score: 83.6, risk: 'LOW' as const },
    { name: 'Fleet Management Systems', regNum: 'REG-FLEET-014', email: 'fleet@fms.com', industry: 'Transportation', revenue: 65000000, score: 80.1, risk: 'MEDIUM' as const },
    { name: 'Professional Training Institute', regNum: 'REG-TRAIN-015', email: 'enroll@pti.com', industry: 'Education', revenue: 15000000, score: 86.7, risk: 'LOW' as const },
    { name: 'BioPharm Supplies', regNum: 'REG-BIO-016', email: 'orders@biopharm.com', industry: 'Pharmaceuticals', revenue: 95000000, score: 90.2, risk: 'LOW' as const },
  ];

  const vendors = [];
  for (const v of vendorData) {
    const vendor = await prisma.vendor.create({
      data: {
        name: v.name,
        registrationNumber: v.regNum,
        email: v.email,
        phone: '+1-555-' + Math.floor(1000 + Math.random() * 9000),
        businessType: v.industry,
        industryType: v.industry,
        yearEstablished: 1990 + Math.floor(Math.random() * 30),
        employeeCount: Math.floor(50 + Math.random() * 500),
        annualRevenue: v.revenue,
        overallScore: v.score,
        financialScore: v.score + (Math.random() * 10 - 5),
        technicalScore: v.score + (Math.random() * 10 - 5),
        complianceScore: v.score + (Math.random() * 10 - 5),
        experienceScore: v.score + (Math.random() * 10 - 5),
        riskLevel: v.risk,
        qualificationStatus: 'QUALIFIED',
        createdById: adminUser.id,
      },
    });
    vendors.push(vendor);
  }

  // Create 15+ Products
  console.log('Creating products...');
  const productData = [
    { name: 'Enterprise Server Pro', category: 'IT Equipment', price: 15000, vendor: 0 },
    { name: 'Network Security Suite', category: 'Software', price: 5000, vendor: 7 },
    { name: 'Office Desk Executive', category: 'Office Furniture', price: 800, vendor: 1 },
    { name: 'Industrial CNC Machine', category: 'Manufacturing Equipment', price: 75000, vendor: 3 },
    { name: 'Medical Imaging System', category: 'Healthcare Equipment', price: 250000, vendor: 5 },
    { name: 'Fleet GPS Tracker', category: 'Transportation', price: 200, vendor: 13 },
    { name: 'Cloud Storage 1TB Plan', category: 'Cloud Services', price: 1200, vendor: 9 },
    { name: 'Solar Panel Array 10kW', category: 'Energy', price: 25000, vendor: 8 },
    { name: 'Precision Drill Set', category: 'Tools', price: 450, vendor: 10 },
    { name: 'Commercial HVAC Unit', category: 'Facilities', price: 12000, vendor: 11 },
    { name: 'Digital Marketing Campaign', category: 'Marketing Services', price: 10000, vendor: 12 },
    { name: 'Leadership Training Program', category: 'Training', price: 3500, vendor: 14 },
    { name: 'Lab Testing Equipment', category: 'Laboratory', price: 45000, vendor: 15 },
    { name: 'Warehouse Forklift', category: 'Logistics', price: 35000, vendor: 6 },
    { name: 'Consulting Strategy Package', category: 'Professional Services', price: 25000, vendor: 4 },
    { name: 'Cybersecurity Assessment', category: 'Security Services', price: 8000, vendor: 7 },
  ];

  const products = [];
  for (const p of productData) {
    const vendor = vendors[p.vendor]!;
    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: p.name,
        description: `High-quality ${p.name} from trusted supplier`,
        category: p.category,
        unitPrice: p.price,
        minOrderQty: 1,
        maxOrderQty: 100,
        currency: 'USD',
        isActive: true,
        inStock: true,
        stockQuantity: Math.floor(10 + Math.random() * 90),
        leadTime: Math.floor(3 + Math.random() * 14),
      },
    });
    products.push(product);
  }

  // Create 15+ Bids
  console.log('Creating bids...');
  const bidStatuses = ['SUBMITTED', 'UNDER_EVALUATION', 'EVALUATED', 'AWARDED', 'REJECTED'];
  for (let i = 0; i < 16; i++) {
    const vendor = vendors[i % vendors.length]!;
    const product = products[i % products.length]!;
    const bidStatus = bidStatuses[Math.floor(Math.random() * bidStatuses.length)] ?? 'SUBMITTED';
    await prisma.bid.create({
      data: {
        title: `Bid for ${product.name}`,
        description: `Procurement bid for ${product.name}`,
        rfpNumber: `RFP-2024-${1000 + i}`,
        vendorId: vendor.id,
        productId: product.id,
        proposedAmount: (product.unitPrice ?? 1000) * (0.9 + Math.random() * 0.2),
        proposedTimeline: Math.floor(7 + Math.random() * 30),
        technicalApproach: 'Comprehensive technical solution with proven methodology',
        status: bidStatus as any,
        technicalScore: 70 + Math.random() * 25,
        costScore: 70 + Math.random() * 25,
        timelineScore: 70 + Math.random() * 25,
        riskScore: 70 + Math.random() * 25,
        overallScore: 70 + Math.random() * 25,
      },
    });
  }

  // Create 15+ Contracts
  console.log('Creating contracts...');
  const contractStatuses = ['DRAFT', 'ACTIVE', 'NEGOTIATING', 'APPROVED', 'EXPIRED'];
  for (let i = 0; i < 16; i++) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1 + Math.floor(Math.random() * 2));

    const vendor = vendors[i % vendors.length]!;
    const contractStatus = contractStatuses[Math.floor(Math.random() * contractStatuses.length)] ?? 'DRAFT';
    const riskLevel = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] ?? 'MEDIUM';
    await prisma.contract.create({
      data: {
        title: `${vendor.name} - Service Contract`,
        contractNumber: `CON-2024-${1000 + i}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        description: `Service agreement with ${vendor.name}`,
        category: vendor.industryType || 'General',
        startDate,
        endDate,
        totalValue: 50000 + Math.floor(Math.random() * 450000),
        currency: 'USD',
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB Destination',
        warrantyTerms: '12 months standard warranty',
        liabilityTerms: 'Standard commercial liability',
        terminationClause: '30 days written notice',
        renewalClause: 'Auto-renewal with 60 days notice',
        status: contractStatus as any,
        riskLevel: riskLevel as any,
        complianceScore: 75 + Math.random() * 20,
        terms: {
          paymentSchedule: 'Monthly',
          escalationClause: '3% annual increase',
          performanceMetrics: ['On-time delivery', 'Quality standards', 'Response time'],
        },
      },
    });
  }

  // Create 15+ RFPs
  console.log('Creating RFPs...');
  const rfpStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED'];
  const rfpCategories = ['IT Equipment', 'Software', 'Professional Services', 'Construction', 'Healthcare', 'Office Supplies'];
  const departments = ['IT', 'Operations', 'HR', 'Finance', 'Marketing', 'Facilities'];

  for (let i = 0; i < 16; i++) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Math.floor(15 + Math.random() * 45));
    const category = rfpCategories[i % rfpCategories.length] ?? 'IT Equipment';
    const department = departments[i % departments.length] ?? 'IT';
    const rfpStatus = rfpStatuses[Math.floor(Math.random() * rfpStatuses.length)] ?? 'DRAFT';

    await prisma.rFP.create({
      data: {
        title: `RFP for ${category} Procurement`,
        rfpNumber: `RFP-2024-${2000 + i}`,
        description: `Request for proposal for ${category} solutions`,
        category: category,
        department: department,
        budget: 50000 + Math.floor(Math.random() * 200000),
        currency: 'USD',
        submissionDeadline: deadline,
        evaluationCriteria: [
          { criterion: 'Technical Capability', weight: 30 },
          { criterion: 'Cost', weight: 25 },
          { criterion: 'Experience', weight: 20 },
          { criterion: 'Timeline', weight: 15 },
          { criterion: 'Compliance', weight: 10 },
        ],
        requirements: [
          { category: 'Technical', requirement: 'Must meet industry standards', priority: 'mandatory' },
          { category: 'Financial', requirement: 'Proven financial stability', priority: 'mandatory' },
          { category: 'Experience', requirement: 'Minimum 5 years experience', priority: 'preferred' },
        ],
        technicalSpecs: 'Detailed technical specifications as per industry standards',
        complianceReqs: ['ISO 9001', 'SOC 2', 'GDPR'],
        status: rfpStatus as any,
      },
    });
  }

  // Create 15+ Spend Records
  console.log('Creating spend records...');
  const spendCategories = ['IT_EQUIPMENT', 'SOFTWARE', 'OFFICE_SUPPLIES', 'PROFESSIONAL_SERVICES', 'CONSTRUCTION', 'HEALTHCARE', 'MANUFACTURING', 'LOGISTICS', 'MARKETING', 'UTILITIES', 'MAINTENANCE', 'TRAVEL', 'OTHER'];

  for (let i = 0; i < 50; i++) {
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 365));

    const vendor = vendors[i % vendors.length]!;
    const category = spendCategories[Math.floor(Math.random() * spendCategories.length)] ?? 'IT_EQUIPMENT';
    const department = departments[Math.floor(Math.random() * departments.length)] ?? 'IT';
    const paymentMethods = ['Wire', 'ACH', 'Check', 'Credit Card'];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)] ?? 'Wire';

    await prisma.spendRecord.create({
      data: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        category: category as any,
        subcategory: 'General',
        amount: 1000 + Math.floor(Math.random() * 50000),
        currency: 'USD',
        transactionDate,
        invoiceNumber: `INV-${2024}-${10000 + i}`,
        poNumber: `PO-${2024}-${20000 + i}`,
        department: department,
        costCenter: `CC-${100 + Math.floor(Math.random() * 10)}`,
        project: `Project ${String.fromCharCode(65 + (i % 10))}`,
        description: `Purchase from ${vendor.name}`,
        paymentMethod: paymentMethod,
      },
    });
  }

  // Create 15+ Savings Opportunities
  console.log('Creating savings opportunities...');
  const savingsTypes = ['VOLUME_DISCOUNT', 'CONTRACT_CONSOLIDATION', 'SUPPLIER_SWITCHING', 'PROCESS_IMPROVEMENT', 'DEMAND_REDUCTION', 'PAYMENT_TERM_OPTIMIZATION', 'SPECIFICATION_CHANGE', 'RENEGOTIATION', 'COMPETITIVE_BIDDING', 'MAVERICK_SPEND_REDUCTION'];
  const savingsStatuses = ['IDENTIFIED', 'UNDER_REVIEW', 'APPROVED', 'IMPLEMENTING', 'REALIZED'];

  const savingsData = [
    { title: 'Consolidate IT Hardware Vendors', category: 'IT_EQUIPMENT', current: 500000, savings: 75000, type: 'CONTRACT_CONSOLIDATION' },
    { title: 'Renegotiate Software Licenses', category: 'SOFTWARE', current: 300000, savings: 45000, type: 'RENEGOTIATION' },
    { title: 'Switch Office Supply Vendor', category: 'OFFICE_SUPPLIES', current: 100000, savings: 15000, type: 'SUPPLIER_SWITCHING' },
    { title: 'Volume Discount for Cloud Services', category: 'SOFTWARE', current: 200000, savings: 30000, type: 'VOLUME_DISCOUNT' },
    { title: 'Reduce Travel Expenses', category: 'TRAVEL', current: 150000, savings: 37500, type: 'DEMAND_REDUCTION' },
    { title: 'Competitive Bidding for Construction', category: 'CONSTRUCTION', current: 1000000, savings: 150000, type: 'COMPETITIVE_BIDDING' },
    { title: 'Optimize Payment Terms', category: 'PROFESSIONAL_SERVICES', current: 250000, savings: 12500, type: 'PAYMENT_TERM_OPTIMIZATION' },
    { title: 'Standardize Equipment Specifications', category: 'MANUFACTURING', current: 400000, savings: 60000, type: 'SPECIFICATION_CHANGE' },
    { title: 'Reduce Maverick Spending in Marketing', category: 'MARKETING', current: 120000, savings: 24000, type: 'MAVERICK_SPEND_REDUCTION' },
    { title: 'Process Improvement for Procurement', category: 'PROFESSIONAL_SERVICES', current: 80000, savings: 16000, type: 'PROCESS_IMPROVEMENT' },
    { title: 'Bulk Purchase Medical Supplies', category: 'HEALTHCARE', current: 350000, savings: 52500, type: 'VOLUME_DISCOUNT' },
    { title: 'Logistics Route Optimization', category: 'LOGISTICS', current: 280000, savings: 42000, type: 'PROCESS_IMPROVEMENT' },
    { title: 'Energy Efficiency Upgrades', category: 'UTILITIES', current: 180000, savings: 36000, type: 'DEMAND_REDUCTION' },
    { title: 'Maintenance Contract Consolidation', category: 'MAINTENANCE', current: 220000, savings: 33000, type: 'CONTRACT_CONSOLIDATION' },
    { title: 'Renegotiate Training Provider Contracts', category: 'PROFESSIONAL_SERVICES', current: 90000, savings: 13500, type: 'RENEGOTIATION' },
    { title: 'Switch to Generic Office Supplies', category: 'OFFICE_SUPPLIES', current: 60000, savings: 18000, type: 'SPECIFICATION_CHANGE' },
  ];

  for (let i = 0; i < savingsData.length; i++) {
    const s = savingsData[i]!;
    const vendor = vendors[i % vendors.length]!;
    const effort = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] ?? 'medium';
    const risk = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] ?? 'MEDIUM';
    const status = savingsStatuses[Math.floor(Math.random() * savingsStatuses.length)] ?? 'IDENTIFIED';
    await prisma.savingsOpportunity.create({
      data: {
        title: s.title,
        description: `Opportunity to save through ${s.type.toLowerCase().replace(/_/g, ' ')}`,
        category: s.category as any,
        savingsType: s.type as any,
        currentSpend: s.current,
        projectedSavings: s.savings,
        savingsPercentage: (s.savings / s.current) * 100,
        currency: 'USD',
        confidence: 70 + Math.floor(Math.random() * 25),
        implementationEffort: effort,
        timeToRealize: 30 + Math.floor(Math.random() * 150),
        riskLevel: risk as any,
        status: status as any,
        vendorName: vendor.name,
        aiRecommendation: `AI recommends pursuing this ${s.type.toLowerCase().replace(/_/g, ' ')} opportunity based on historical data analysis.`,
        actionItems: [
          'Review current contracts',
          'Identify potential vendors',
          'Prepare negotiation strategy',
          'Implement changes',
          'Monitor results',
        ],
      },
    });
  }

  // Create 25+ Compliance Checks
  console.log('Creating compliance checks...');
  const complianceData = [
    { regType: 'Financial', regName: 'SOX Compliance Audit', result: 'COMPLIANT' as const, score: 92, severity: 'high', issues: ['Minor documentation gaps'], critical: [] as string[], recs: ['Update financial reporting templates'] },
    { regType: 'Data Protection', regName: 'GDPR Data Processing Review', result: 'PARTIALLY_COMPLIANT' as const, score: 68, severity: 'critical', issues: ['Consent forms outdated', 'Data retention policy unclear'], critical: ['Missing Data Protection Impact Assessment'], recs: ['Conduct DPIA', 'Update consent forms', 'Clarify retention policy'] },
    { regType: 'Quality', regName: 'ISO 9001 Quality Management', result: 'COMPLIANT' as const, score: 88, severity: 'medium', issues: ['Process documentation needs update'], critical: [] as string[], recs: ['Schedule annual review of QMS documentation'] },
    { regType: 'Security', regName: 'SOC 2 Type II Assessment', result: 'COMPLIANT' as const, score: 95, severity: 'high', issues: [] as string[], critical: [] as string[], recs: ['Continue annual assessments'] },
    { regType: 'Environmental', regName: 'EPA Emissions Compliance', result: 'NON_COMPLIANT' as const, score: 42, severity: 'critical', issues: ['Emissions exceed limits', 'Missing quarterly reports'], critical: ['Exceeds NOx emission threshold by 15%'], recs: ['Install scrubbers', 'Submit overdue reports', 'Engage environmental consultant'] },
    { regType: 'Labor', regName: 'OSHA Workplace Safety Audit', result: 'PARTIALLY_COMPLIANT' as const, score: 71, severity: 'high', issues: ['Safety training records incomplete', 'Missing fire extinguisher inspections'], critical: [] as string[], recs: ['Complete safety training for all staff', 'Schedule fire equipment inspection'] },
    { regType: 'Financial', regName: 'Anti-Money Laundering (AML) Check', result: 'COMPLIANT' as const, score: 90, severity: 'high', issues: ['KYC documentation for 2 vendors pending'], critical: [] as string[], recs: ['Complete pending KYC reviews'] },
    { regType: 'Data Protection', regName: 'CCPA Consumer Rights Compliance', result: 'COMPLIANT' as const, score: 85, severity: 'medium', issues: ['Response time for data requests slightly above target'], critical: [] as string[], recs: ['Automate data request processing'] },
    { regType: 'Quality', regName: 'ISO 14001 Environmental Management', result: 'REQUIRES_REVIEW' as const, score: 60, severity: 'medium', issues: ['Certification expiring in 60 days', 'Audit findings not addressed'], critical: [] as string[], recs: ['Schedule recertification audit', 'Address open findings'] },
    { regType: 'Security', regName: 'PCI DSS Payment Card Security', result: 'COMPLIANT' as const, score: 93, severity: 'critical', issues: [] as string[], critical: [] as string[], recs: ['Maintain quarterly vulnerability scans'] },
    { regType: 'Legal', regName: 'Contract Terms Compliance Review', result: 'PARTIALLY_COMPLIANT' as const, score: 72, severity: 'medium', issues: ['3 contracts missing force majeure clauses', 'SLA penalties not enforced'], critical: [] as string[], recs: ['Amend contracts with missing clauses', 'Implement SLA monitoring'] },
    { regType: 'Financial', regName: 'Tax Compliance Verification', result: 'COMPLIANT' as const, score: 96, severity: 'high', issues: [] as string[], critical: [] as string[], recs: ['Continue quarterly tax reviews'] },
    { regType: 'Security', regName: 'Cybersecurity Framework Assessment', result: 'PARTIALLY_COMPLIANT' as const, score: 65, severity: 'critical', issues: ['MFA not enforced for all users', 'Incident response plan outdated'], critical: ['Privileged accounts without MFA'], recs: ['Enforce MFA organization-wide', 'Update incident response plan', 'Conduct tabletop exercise'] },
    { regType: 'Quality', regName: 'Vendor Quality Scorecard Review', result: 'COMPLIANT' as const, score: 82, severity: 'low', issues: ['2 vendors below quality threshold'], critical: [] as string[], recs: ['Issue corrective action requests to underperforming vendors'] },
    { regType: 'Environmental', regName: 'Waste Disposal Compliance', result: 'COMPLIANT' as const, score: 88, severity: 'medium', issues: ['Waste manifest records need digitization'], critical: [] as string[], recs: ['Implement digital waste tracking system'] },
    { regType: 'Data Protection', regName: 'Data Breach Response Readiness', result: 'REQUIRES_REVIEW' as const, score: 55, severity: 'critical', issues: ['Response team not tested in 12 months', 'Notification procedures not updated'], critical: ['No breach simulation conducted this year'], recs: ['Conduct breach simulation', 'Update notification procedures', 'Train response team'] },
    { regType: 'Labor', regName: 'Equal Employment Opportunity Review', result: 'COMPLIANT' as const, score: 91, severity: 'medium', issues: [] as string[], critical: [] as string[], recs: ['Continue diversity reporting'] },
    { regType: 'Financial', regName: 'Procurement Spend Audit', result: 'PARTIALLY_COMPLIANT' as const, score: 73, severity: 'high', issues: ['Maverick spending detected in 3 departments', 'Approval workflows bypassed'], critical: [] as string[], recs: ['Enforce approval workflows', 'Train department heads on procurement policy'] },
    { regType: 'Security', regName: 'Physical Security Assessment', result: 'COMPLIANT' as const, score: 87, severity: 'medium', issues: ['Badge access logs not reviewed monthly'], critical: [] as string[], recs: ['Automate access log reviews'] },
    { regType: 'Legal', regName: 'Intellectual Property Rights Check', result: 'COMPLIANT' as const, score: 94, severity: 'high', issues: [] as string[], critical: [] as string[], recs: ['Continue IP monitoring for all vendor agreements'] },
    { regType: 'Quality', regName: 'Supplier Diversity Compliance', result: 'REQUIRES_REVIEW' as const, score: 58, severity: 'medium', issues: ['Diverse supplier ratio below 15% target', 'Reporting format inconsistent'], critical: [] as string[], recs: ['Expand diverse supplier outreach', 'Standardize reporting'] },
    { regType: 'Environmental', regName: 'Carbon Footprint Reporting', result: 'PARTIALLY_COMPLIANT' as const, score: 66, severity: 'medium', issues: ['Scope 3 emissions not fully tracked', 'Baseline year data incomplete'], critical: [] as string[], recs: ['Implement Scope 3 tracking', 'Complete baseline data collection'] },
    { regType: 'Financial', regName: 'Foreign Corrupt Practices Act (FCPA)', result: 'COMPLIANT' as const, score: 97, severity: 'critical', issues: [] as string[], critical: [] as string[], recs: ['Maintain annual FCPA training for all procurement staff'] },
    { regType: 'Security', regName: 'Vendor Access Control Review', result: 'NON_COMPLIANT' as const, score: 38, severity: 'critical', issues: ['5 terminated vendor accounts still active', 'No quarterly access reviews'], critical: ['Active accounts for terminated vendors pose security risk'], recs: ['Immediately disable terminated accounts', 'Implement quarterly access reviews', 'Deploy automated deprovisioning'] },
    { regType: 'Legal', regName: 'Export Control Compliance', result: 'COMPLIANT' as const, score: 89, severity: 'high', issues: ['Screening database update delayed by 1 week'], critical: [] as string[], recs: ['Automate screening database updates'] },
    { regType: 'Quality', regName: 'Service Level Agreement Monitoring', result: 'PARTIALLY_COMPLIANT' as const, score: 70, severity: 'medium', issues: ['4 vendors missed SLA targets last quarter', 'SLA dashboards not real-time'], critical: [] as string[], recs: ['Implement real-time SLA monitoring', 'Issue performance notices'] },
    { regType: 'Data Protection', regName: 'Third-Party Data Sharing Audit', result: 'REQUIRES_REVIEW' as const, score: 52, severity: 'high', issues: ['Data sharing agreements missing for 3 vendors', 'No audit trail for shared data'], critical: ['Uncontrolled data sharing with third parties'], recs: ['Execute data sharing agreements', 'Implement data sharing audit trail'] },
    { regType: 'Financial', regName: 'Budget Variance Analysis', result: 'COMPLIANT' as const, score: 84, severity: 'low', issues: ['Minor variance in Q3 IT spending'], critical: [] as string[], recs: ['Review IT spending allocation for next quarter'] },
  ];

  for (let i = 0; i < complianceData.length; i++) {
    const c = complianceData[i]!;
    const vendor = vendors[i % vendors.length]!;
    const checkedAt = new Date();
    checkedAt.setDate(checkedAt.getDate() - Math.floor(Math.random() * 90));

    await prisma.complianceCheck.create({
      data: {
        entityType: 'vendor',
        entityId: vendor.id,
        vendorId: vendor.id,
        regulationType: c.regType,
        regulationName: c.regName,
        checkResult: c.result,
        complianceScore: c.score,
        issues: c.issues,
        criticalIssues: c.critical,
        recommendations: c.recs,
        checkedAt,
        checkedById: adminUser.id,
      },
    });
  }

  console.log('Database seed completed successfully!');
  console.log(`Created:
  - ${vendorData.length} vendors
  - ${productData.length} products
  - 16 bids
  - 16 contracts
  - 16 RFPs
  - 50 spend records
  - ${savingsData.length} savings opportunities
  - ${complianceData.length} compliance checks`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
