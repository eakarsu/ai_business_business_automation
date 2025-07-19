import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user first
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@procurement.com' },
    update: {},
    create: {
      email: 'admin@procurement.com',
      password: await bcrypt.hash('password', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'Procurement',
      organization: 'Government Agency',
    },
  });

  // IT Equipment Vendor
  const techVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-TECH-001' },
    update: {},
    create: {
      name: 'TechPro Solutions',
      registrationNumber: 'REG-TECH-001',
      email: 'contact@techprosolutions.com',
      phone: '+1-555-0123',
      website: 'https://techprosolutions.com',
      address: {
        street: '123 Technology Drive',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95110',
        country: 'USA'
      },
      businessType: 'Technology Solutions',
      industryType: 'Information Technology',
      yearEstablished: 2010,
      employeeCount: 250,
      annualRevenue: 50000000,
      overallScore: 85.5,
      financialScore: 88.0,
      technicalScore: 92.0,
      complianceScore: 82.0,
      experienceScore: 87.0,
      riskLevel: 'LOW',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Office Supplies Vendor
  const officeVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-OFFICE-002' },
    update: {},
    create: {
      name: 'Office Essentials Inc',
      registrationNumber: 'REG-OFFICE-002',
      email: 'sales@officeessentials.com',
      phone: '+1-555-0456',
      website: 'https://officeessentials.com',
      address: {
        street: '456 Business Park',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'USA'
      },
      businessType: 'Office Supply Distribution',
      industryType: 'Retail/Distribution',
      yearEstablished: 1995,
      employeeCount: 150,
      annualRevenue: 25000000,
      overallScore: 78.2,
      financialScore: 75.0,
      technicalScore: 70.0,
      complianceScore: 85.0,
      experienceScore: 82.0,
      riskLevel: 'MEDIUM',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Construction Materials Vendor
  const constructionVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-CONST-003' },
    update: {},
    create: {
      name: 'BuildRight Materials',
      registrationNumber: 'REG-CONST-003',
      email: 'info@buildrightmaterials.com',
      phone: '+1-555-0789',
      website: 'https://buildrightmaterials.com',
      address: {
        street: '789 Industrial Way',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        country: 'USA'
      },
      businessType: 'Construction Materials',
      industryType: 'Construction',
      yearEstablished: 1988,
      employeeCount: 400,
      annualRevenue: 75000000,
      overallScore: 81.7,
      financialScore: 83.0,
      technicalScore: 85.0,
      complianceScore: 78.0,
      experienceScore: 80.0,
      riskLevel: 'MEDIUM',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Manufacturing Equipment Vendor
  const manufacturingVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-MFG-004' },
    update: {},
    create: {
      name: 'Industrial Equipment Solutions',
      registrationNumber: 'REG-MFG-004',
      email: 'sales@industrialequip.com',
      phone: '+1-555-0901',
      website: 'https://industrialequip.com',
      address: {
        street: '321 Manufacturing Blvd',
        city: 'Detroit',
        state: 'MI',
        zipCode: '48201',
        country: 'USA'
      },
      businessType: 'Manufacturing Equipment',
      industryType: 'Manufacturing',
      yearEstablished: 1985,
      employeeCount: 350,
      annualRevenue: 85000000,
      overallScore: 84.2,
      financialScore: 86.0,
      technicalScore: 89.0,
      complianceScore: 81.0,
      experienceScore: 82.0,
      riskLevel: 'LOW',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Consulting Services Vendor
  const consultingVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-CONSULT-005' },
    update: {},
    create: {
      name: 'Strategic Advisory Group',
      registrationNumber: 'REG-CONSULT-005',
      email: 'contact@strategicadvisory.com',
      phone: '+1-555-1234',
      website: 'https://strategicadvisory.com',
      address: {
        street: '555 Corporate Plaza',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      businessType: 'Management Consulting',
      industryType: 'Consulting',
      yearEstablished: 2005,
      employeeCount: 180,
      annualRevenue: 35000000,
      overallScore: 87.5,
      financialScore: 84.0,
      technicalScore: 85.0,
      complianceScore: 90.0,
      experienceScore: 91.0,
      riskLevel: 'LOW',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Healthcare Equipment Vendor
  const healthcareVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-HEALTH-006' },
    update: {},
    create: {
      name: 'MedTech Solutions Inc',
      registrationNumber: 'REG-HEALTH-006',
      email: 'info@medtechsolutions.com',
      phone: '+1-555-5678',
      website: 'https://medtechsolutions.com',
      address: {
        street: '100 Healthcare Drive',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA'
      },
      businessType: 'Medical Equipment',
      industryType: 'Healthcare',
      yearEstablished: 1992,
      employeeCount: 280,
      annualRevenue: 65000000,
      overallScore: 88.3,
      financialScore: 87.0,
      technicalScore: 92.0,
      complianceScore: 89.0,
      experienceScore: 85.0,
      riskLevel: 'LOW',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Education Equipment Vendor
  const educationVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-EDU-007' },
    update: {},
    create: {
      name: 'EduTech Resources',
      registrationNumber: 'REG-EDU-007',
      email: 'sales@edutechresources.com',
      phone: '+1-555-9876',
      website: 'https://edutechresources.com',
      address: {
        street: '200 Campus Way',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        country: 'USA'
      },
      businessType: 'Educational Equipment',
      industryType: 'Education',
      yearEstablished: 2000,
      employeeCount: 120,
      annualRevenue: 28000000,
      overallScore: 82.7,
      financialScore: 80.0,
      technicalScore: 83.0,
      complianceScore: 86.0,
      experienceScore: 82.0,
      riskLevel: 'MEDIUM',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Other Services Vendor
  const otherVendor = await prisma.vendor.upsert({
    where: { registrationNumber: 'REG-OTHER-008' },
    update: {},
    create: {
      name: 'Universal Services Corp',
      registrationNumber: 'REG-OTHER-008',
      email: 'info@universalservices.com',
      phone: '+1-555-4567',
      website: 'https://universalservices.com',
      address: {
        street: '888 Service Boulevard',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        country: 'USA'
      },
      businessType: 'General Services',
      industryType: 'Other',
      yearEstablished: 1997,
      employeeCount: 200,
      annualRevenue: 42000000,
      overallScore: 79.8,
      financialScore: 78.0,
      technicalScore: 76.0,
      complianceScore: 84.0,
      experienceScore: 81.0,
      riskLevel: 'MEDIUM',
      qualificationStatus: 'QUALIFIED',
      createdById: adminUser.id,
    },
  });

  // Create products for TechPro Solutions
  const techProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Dell OptiPlex 7090 Desktop',
        description: 'High-performance business desktop computer with Intel i7 processor',
        category: 'Computing Equipment',
        subcategory: 'Desktop Computers',
        sku: 'DELL-7090-I7',
        manufacturer: 'Dell',
        model: 'OptiPlex 7090',
        imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400',
        unitPrice: 1299.99,
        minOrderQty: 1,
        maxOrderQty: 500,
        specifications: {
          processor: 'Intel Core i7-11700',
          memory: '16GB DDR4',
          storage: '512GB SSD',
          graphics: 'Intel UHD Graphics 630',
          warranty: '3 years'
        },
        dimensions: {
          length: 11.7,
          width: 3.7,
          height: 11.5,
          unit: 'inches'
        },
        weight: 12.5,
        certifications: ['ENERGY STAR', 'EPEAT Gold', 'TCO Certified'],
        stockQuantity: 150,
        leadTime: 7,
        complianceStandards: ['FCC', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.7,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Cisco Catalyst 2960-X Switch',
        description: '24-port Gigabit Ethernet switch with PoE+',
        category: 'Network Equipment',
        subcategory: 'Switches',
        sku: 'CISCO-2960X-24',
        manufacturer: 'Cisco',
        model: 'Catalyst 2960-X',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
        unitPrice: 2499.99,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          ports: '24 x 1GB Ethernet',
          poe: '370W PoE+',
          switching: '56 Gbps',
          stackable: true,
          management: 'Web-based, CLI, SNMP'
        },
        dimensions: {
          length: 17.3,
          width: 11.0,
          height: 1.7,
          unit: 'inches'
        },
        weight: 8.8,
        certifications: ['UL', 'CSA', 'CE'],
        stockQuantity: 45,
        leadTime: 14,
        complianceStandards: ['FCC', 'UL', 'CSA', 'CE'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.6,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'HP LaserJet Pro M404dn',
        description: 'Monochrome laser printer with duplex printing',
        category: 'Office Equipment',
        subcategory: 'Printers',
        sku: 'HP-M404DN',
        manufacturer: 'HP',
        model: 'LaserJet Pro M404dn',
        imageUrl: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400',
        unitPrice: 329.99,
        minOrderQty: 1,
        maxOrderQty: 200,
        specifications: {
          type: 'Monochrome Laser',
          speed: '38 ppm',
          duplex: 'Automatic',
          connectivity: 'Ethernet, USB',
          memory: '256MB'
        },
        dimensions: {
          length: 14.2,
          width: 8.5,
          height: 8.7,
          unit: 'inches'
        },
        weight: 18.7,
        certifications: ['ENERGY STAR', 'Blue Angel'],
        stockQuantity: 85,
        leadTime: 5,
        complianceStandards: ['FCC', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Lenovo ThinkPad E15 Laptop',
        description: 'Business laptop with AMD Ryzen 7 processor and 15.6" display',
        category: 'Computing Equipment',
        subcategory: 'Laptops',
        sku: 'LENOVO-E15-R7',
        manufacturer: 'Lenovo',
        model: 'ThinkPad E15',
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        unitPrice: 899.99,
        minOrderQty: 1,
        maxOrderQty: 300,
        specifications: {
          processor: 'AMD Ryzen 7 4700U',
          memory: '8GB DDR4',
          storage: '256GB SSD',
          display: '15.6" Full HD',
          battery: '45Wh'
        },
        dimensions: {
          length: 14.13,
          width: 9.22,
          height: 0.78,
          unit: 'inches'
        },
        weight: 3.75,
        certifications: ['ENERGY STAR', 'EPEAT Bronze'],
        stockQuantity: 120,
        leadTime: 10,
        complianceStandards: ['FCC', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.3,
          performance: 4.4,
          support: 4.1
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Fortinet FortiGate 60E Firewall',
        description: 'Next-generation firewall with threat protection',
        category: 'Security Equipment',
        subcategory: 'Firewalls',
        sku: 'FORTI-60E',
        manufacturer: 'Fortinet',
        model: 'FortiGate 60E',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
        unitPrice: 1899.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          throughput: '10 Gbps',
          ports: '5 x 1GbE',
          vpn: '200 IPSec tunnels',
          users: '200 concurrent',
          protection: 'IPS, AV, Web Filtering'
        },
        dimensions: {
          length: 8.27,
          width: 6.50,
          height: 1.57,
          unit: 'inches'
        },
        weight: 4.4,
        certifications: ['UL', 'CSA', 'CE', 'FCC'],
        stockQuantity: 25,
        leadTime: 21,
        complianceStandards: ['FCC', 'UL', 'CSA', 'CE', 'FIPS 140-2'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.8,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Microsoft Surface Pro 9',
        description: '2-in-1 tablet with detachable keyboard and stylus',
        category: 'Computing Equipment',
        subcategory: 'Tablets',
        sku: 'MSFT-SURFACE-PRO9',
        manufacturer: 'Microsoft',
        model: 'Surface Pro 9',
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        unitPrice: 1299.99,
        minOrderQty: 1,
        maxOrderQty: 150,
        specifications: {
          processor: 'Intel Core i7-1255U',
          memory: '16GB LPDDR5',
          storage: '256GB SSD',
          display: '13" PixelSense',
          battery: '15.5 hours'
        },
        dimensions: {
          length: 11.3,
          width: 8.2,
          height: 0.37,
          unit: 'inches'
        },
        weight: 1.96,
        certifications: ['ENERGY STAR', 'EPEAT Gold'],
        stockQuantity: 60,
        leadTime: 12,
        complianceStandards: ['FCC', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.2,
          performance: 4.6,
          support: 4.0
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Ubiquiti UniFi Dream Machine',
        description: 'All-in-one network appliance with router, switch, and Wi-Fi 6',
        category: 'Network Equipment',
        subcategory: 'Routers',
        sku: 'UBNT-UDM',
        manufacturer: 'Ubiquiti',
        model: 'UniFi Dream Machine',
        imageUrl: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400',
        unitPrice: 549.99,
        minOrderQty: 1,
        maxOrderQty: 75,
        specifications: {
          wifi: 'Wi-Fi 6 (802.11ax)',
          ports: '8 x 1GbE + 2 x 10GbE SFP+',
          throughput: '3.5 Gbps',
          coverage: '4,000 sq ft',
          management: 'UniFi Controller'
        },
        dimensions: {
          length: 8.7,
          width: 8.7,
          height: 2.1,
          unit: 'inches'
        },
        weight: 4.6,
        certifications: ['FCC', 'CE', 'UL'],
        stockQuantity: 40,
        leadTime: 18,
        complianceStandards: ['FCC', 'CE', 'UL'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.7,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Samsung 27" 4K Monitor',
        description: 'Professional 4K UHD monitor with USB-C connectivity',
        category: 'Computing Equipment',
        subcategory: 'Monitors',
        sku: 'SAMSUNG-27-4K',
        manufacturer: 'Samsung',
        model: 'M7 Smart Monitor',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
        unitPrice: 449.99,
        minOrderQty: 1,
        maxOrderQty: 200,
        specifications: {
          resolution: '3840 x 2160 4K UHD',
          size: '27 inches',
          connectivity: 'USB-C, HDMI, Wi-Fi',
          refresh: '60Hz',
          panel: 'VA'
        },
        dimensions: {
          length: 24.1,
          width: 14.2,
          height: 2.2,
          unit: 'inches'
        },
        weight: 11.7,
        certifications: ['ENERGY STAR', 'TCO Certified'],
        stockQuantity: 95,
        leadTime: 8,
        complianceStandards: ['FCC', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.1
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'VMware vSphere Enterprise Plus',
        description: 'Virtualization platform for enterprise data centers',
        category: 'Software',
        subcategory: 'Virtualization',
        sku: 'VMWARE-VSPHERE-EP',
        manufacturer: 'VMware',
        model: 'vSphere Enterprise Plus',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
        unitPrice: 4299.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          type: 'Virtualization Software',
          support: 'vMotion, DRS, HA',
          storage: 'vSAN, VMFS',
          networking: 'Distributed Switch',
          licensing: 'Per CPU'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['FIPS 140-2', 'Common Criteria'],
        stockQuantity: 25,
        leadTime: 3,
        complianceStandards: ['NIST', 'ISO 27001', 'SOC 2'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'APC Smart-UPS 1500VA',
        description: 'Uninterruptible Power Supply with LCD display',
        category: 'Power Equipment',
        subcategory: 'UPS Systems',
        sku: 'APC-SMART-1500',
        manufacturer: 'APC',
        model: 'Smart-UPS 1500VA',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fbd6c327e075?w=400',
        unitPrice: 599.99,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          capacity: '1500VA/980W',
          runtime: '10 minutes at full load',
          outlets: '8 outlets',
          battery: 'Replaceable',
          display: 'LCD status'
        },
        dimensions: {
          length: 17.0,
          width: 8.1,
          height: 8.6,
          unit: 'inches'
        },
        weight: 48.3,
        certifications: ['UL', 'CSA', 'FCC'],
        stockQuantity: 65,
        leadTime: 7,
        complianceStandards: ['UL', 'CSA', 'FCC'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.5,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: techVendor.id,
        name: 'Synology DS920+ NAS',
        description: '4-bay Network Attached Storage for small businesses',
        category: 'Storage Equipment',
        subcategory: 'NAS Systems',
        sku: 'SYNOLOGY-DS920+',
        manufacturer: 'Synology',
        model: 'DiskStation DS920+',
        imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
        unitPrice: 549.99,
        minOrderQty: 1,
        maxOrderQty: 75,
        specifications: {
          bays: '4-bay',
          processor: 'Intel Celeron J4125',
          memory: '4GB DDR4',
          network: '2 x 1GbE',
          capacity: 'Up to 64TB'
        },
        dimensions: {
          length: 9.9,
          width: 8.8,
          height: 6.6,
          unit: 'inches'
        },
        weight: 5.1,
        certifications: ['FCC', 'CE', 'RoHS'],
        stockQuantity: 35,
        leadTime: 14,
        complianceStandards: ['FCC', 'CE', 'RoHS'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.4,
          support: 4.2
        }
      }
    })
  ]);

  // Create products for Office Essentials Inc
  const officeProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Staples Copy Paper 20lb',
        description: 'High-quality multipurpose copy paper, 500 sheets per ream',
        category: 'Office Supplies',
        subcategory: 'Paper Products',
        sku: 'STAPLES-COPY-20',
        manufacturer: 'Staples',
        model: 'Copy Paper 20lb',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        unitPrice: 8.99,
        minOrderQty: 10,
        maxOrderQty: 1000,
        specifications: {
          weight: '20 lb',
          brightness: '92',
          size: '8.5 x 11 inches',
          sheets: 500,
          recycled: '30% post-consumer'
        },
        dimensions: {
          length: 11,
          width: 8.5,
          height: 2.1,
          unit: 'inches'
        },
        weight: 5.0,
        certifications: ['FSC Certified', 'SFI Certified'],
        stockQuantity: 500,
        leadTime: 2,
        complianceStandards: ['FSC', 'SFI'],
        qualityRatings: {
          reliability: 4.2,
          performance: 4.1,
          support: 4.0
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Steelcase Series 1 Office Chair',
        description: 'Ergonomic office chair with lumbar support and adjustable arms',
        category: 'Furniture',
        subcategory: 'Office Chairs',
        sku: 'STEEL-SERIES1',
        manufacturer: 'Steelcase',
        model: 'Series 1',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        unitPrice: 415.00,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          backSupport: 'Lumbar support',
          armrests: 'Adjustable',
          seat: 'Cushioned',
          base: '5-star base with casters',
          warranty: '12 years'
        },
        dimensions: {
          length: 26.8,
          width: 26.8,
          height: 40.2,
          unit: 'inches'
        },
        weight: 38.0,
        certifications: ['GREENGUARD Gold', 'Cradle to Cradle'],
        stockQuantity: 75,
        leadTime: 10,
        complianceStandards: ['GREENGUARD', 'ANSI/BIFMA'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.5,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Sharpie Permanent Markers',
        description: 'Fine tip permanent markers, assorted colors, 12-pack',
        category: 'Office Supplies',
        subcategory: 'Writing Instruments',
        sku: 'SHARPIE-FINE-12',
        manufacturer: 'Sharpie',
        model: 'Fine Tip Permanent',
        imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
        unitPrice: 14.99,
        minOrderQty: 5,
        maxOrderQty: 500,
        specifications: {
          tip: 'Fine tip',
          colors: '12 assorted colors',
          ink: 'Permanent',
          quantity: 12,
          capType: 'Snap-on cap'
        },
        dimensions: {
          length: 5.4,
          width: 0.6,
          height: 0.6,
          unit: 'inches'
        },
        weight: 0.5,
        certifications: ['AP Certified'],
        stockQuantity: 200,
        leadTime: 1,
        complianceStandards: ['ASTM D4236', 'CPSIA'],
        qualityRatings: {
          reliability: 4.3,
          performance: 4.4,
          support: 4.1
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Herman Miller Aeron Chair',
        description: 'Ergonomic office chair with advanced PostureFit SL back support',
        category: 'Furniture',
        subcategory: 'Office Chairs',
        sku: 'HM-AERON-B',
        manufacturer: 'Herman Miller',
        model: 'Aeron Chair Size B',
        imageUrl: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400',
        unitPrice: 1395.00,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          size: 'Size B (Medium)',
          material: 'Pellicle mesh',
          armrests: 'Adjustable',
          tilt: 'Forward tilt',
          warranty: '12 years'
        },
        dimensions: {
          length: 27,
          width: 27,
          height: 41,
          unit: 'inches'
        },
        weight: 43.0,
        certifications: ['GREENGUARD Gold', 'Cradle to Cradle Bronze'],
        stockQuantity: 30,
        leadTime: 14,
        complianceStandards: ['GREENGUARD', 'ANSI/BIFMA X5.1'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.9,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Staples Multifunction Desk',
        description: 'Height-adjustable sit-stand desk with storage',
        category: 'Furniture',
        subcategory: 'Desks',
        sku: 'STAPLES-DESK-ADJ',
        manufacturer: 'Staples',
        model: 'Adjustable Multifunction',
        unitPrice: 799.99,
        minOrderQty: 1,
        maxOrderQty: 25,
        specifications: {
          height: 'Adjustable 29-49 inches',
          surface: 'Laminated wood',
          drawers: '2 file drawers',
          weight_capacity: '150 lbs',
          motor: 'Electric height adjustment'
        },
        dimensions: {
          length: 60,
          width: 30,
          height: 49,
          unit: 'inches'
        },
        weight: 85.0,
        certifications: ['GREENGUARD', 'CARB2'],
        stockQuantity: 40,
        leadTime: 21,
        complianceStandards: ['GREENGUARD', 'ANSI/BIFMA'],
        qualityRatings: {
          reliability: 4.2,
          performance: 4.3,
          support: 4.1
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Canon ImageClass Printer',
        description: 'Multifunction laser printer with scanning and faxing',
        category: 'Office Equipment',
        subcategory: 'Printers',
        sku: 'CANON-MF445DW',
        manufacturer: 'Canon',
        model: 'ImageClass MF445dw',
        unitPrice: 299.99,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          type: 'Monochrome Laser MFP',
          speed: '40 ppm',
          functions: 'Print, Scan, Copy, Fax',
          connectivity: 'WiFi, Ethernet, USB',
          duplex: 'Automatic'
        },
        dimensions: {
          length: 16.1,
          width: 15.4,
          height: 12.2,
          unit: 'inches'
        },
        weight: 37.7,
        certifications: ['ENERGY STAR', 'EPEAT Silver'],
        stockQuantity: 60,
        leadTime: 5,
        complianceStandards: ['FCC', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.3,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Pendaflex File Folders',
        description: 'Letter size file folders with 1/3 cut tabs, 100 pack',
        category: 'Office Supplies',
        subcategory: 'Filing',
        sku: 'PEND-FILE-100',
        manufacturer: 'Pendaflex',
        model: 'Standard File Folders',
        unitPrice: 24.99,
        minOrderQty: 10,
        maxOrderQty: 1000,
        specifications: {
          size: 'Letter (8.5 x 11)',
          tabs: '1/3 cut assorted',
          material: '11 pt manila',
          quantity: 100,
          color: 'Manila'
        },
        dimensions: {
          length: 11.75,
          width: 9.5,
          height: 0.75,
          unit: 'inches'
        },
        weight: 3.2,
        certifications: ['FSC Certified'],
        stockQuantity: 400,
        leadTime: 2,
        complianceStandards: ['FSC'],
        qualityRatings: {
          reliability: 4.1,
          performance: 4.0,
          support: 3.9
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: officeVendor.id,
        name: 'Fellowes Laminator',
        description: 'Professional laminator with temperature control',
        category: 'Office Equipment',
        subcategory: 'Laminating',
        sku: 'FELLOW-LAM-PRO',
        manufacturer: 'Fellowes',
        model: 'Laminator Pro',
        unitPrice: 189.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          width: '12.5 inches',
          pouches: '3mil to 10mil',
          warmup: '4 minutes',
          speed: '39 inches per minute',
          features: 'Auto shut-off, jam release'
        },
        dimensions: {
          length: 18.5,
          width: 6.3,
          height: 4.3,
          unit: 'inches'
        },
        weight: 8.5,
        certifications: ['UL', 'CSA'],
        stockQuantity: 25,
        leadTime: 7,
        complianceStandards: ['UL', 'CSA'],
        qualityRatings: {
          reliability: 4.3,
          performance: 4.2,
          support: 4.0
        }
      }
    })
  ]);

  // Create products for BuildRight Materials
  const constructionProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Portland Cement Type I',
        description: 'High-quality Portland cement for general construction use',
        category: 'Construction Materials',
        subcategory: 'Cement',
        sku: 'PORTLAND-TYPE1',
        manufacturer: 'LafargeHolcim',
        model: 'Type I Portland',
        unitPrice: 12.50,
        minOrderQty: 50,
        maxOrderQty: 5000,
        specifications: {
          type: 'Type I Portland Cement',
          strength: '28-day 4000 psi',
          fineness: '350 m²/kg',
          weight: '94 lbs per bag',
          coverage: '0.6 cubic feet'
        },
        dimensions: {
          length: 24,
          width: 12,
          height: 6,
          unit: 'inches'
        },
        weight: 94.0,
        certifications: ['ASTM C150', 'AASHTO M85'],
        stockQuantity: 1000,
        leadTime: 7,
        complianceStandards: ['ASTM C150', 'AASHTO M85'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Steel Rebar #4 Grade 60',
        description: 'Deformed steel reinforcement bar for concrete construction',
        category: 'Construction Materials',
        subcategory: 'Reinforcement',
        sku: 'REBAR-4-G60',
        manufacturer: 'Nucor',
        model: '#4 Grade 60',
        unitPrice: 18.75,
        minOrderQty: 20,
        maxOrderQty: 2000,
        specifications: {
          grade: 'Grade 60',
          diameter: '0.5 inches',
          length: '20 feet',
          yield: '60,000 psi',
          tensile: '90,000 psi'
        },
        dimensions: {
          length: 240,
          width: 0.5,
          height: 0.5,
          unit: 'inches'
        },
        weight: 0.668,
        certifications: ['ASTM A615', 'CRSI'],
        stockQuantity: 800,
        leadTime: 14,
        complianceStandards: ['ASTM A615', 'AASHTO M31'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.8,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Plywood Sheathing 1/2" CDX',
        description: 'Structural plywood sheathing for construction applications',
        category: 'Construction Materials',
        subcategory: 'Lumber',
        sku: 'PLYWOOD-CDX-12',
        manufacturer: 'Georgia-Pacific',
        model: 'CDX 1/2"',
        unitPrice: 42.99,
        minOrderQty: 10,
        maxOrderQty: 500,
        specifications: {
          thickness: '1/2 inch',
          grade: 'CDX',
          size: '4x8 feet',
          glue: 'Exterior grade',
          species: 'Douglas Fir'
        },
        dimensions: {
          length: 96,
          width: 48,
          height: 0.5,
          unit: 'inches'
        },
        weight: 46.0,
        certifications: ['APA', 'CARB2'],
        stockQuantity: 300,
        leadTime: 5,
        complianceStandards: ['APA', 'CARB2', 'PS 1-09'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.1
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Concrete Blocks 8x8x16',
        description: 'Standard concrete masonry units for construction',
        category: 'Construction Materials',
        subcategory: 'Masonry',
        sku: 'CMU-8X8X16',
        manufacturer: 'Oldcastle',
        model: 'Standard CMU',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
        unitPrice: 3.45,
        minOrderQty: 100,
        maxOrderQty: 10000,
        specifications: {
          dimensions: '8x8x16 inches',
          strength: '1900 psi',
          weight: '38 lbs',
          absorption: 'Less than 13%',
          type: 'Hollow core'
        },
        dimensions: {
          length: 16,
          width: 8,
          height: 8,
          unit: 'inches'
        },
        weight: 38.0,
        certifications: ['ASTM C90', 'NCMA'],
        stockQuantity: 5000,
        leadTime: 3,
        complianceStandards: ['ASTM C90', 'AASHTO M194'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.5,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Steel I-Beam W8x31',
        description: 'Wide flange steel beam for structural applications',
        category: 'Construction Materials',
        subcategory: 'Structural Steel',
        sku: 'BEAM-W8X31',
        manufacturer: 'Nucor',
        model: 'W8x31',
        unitPrice: 145.50,
        minOrderQty: 5,
        maxOrderQty: 200,
        specifications: {
          depth: '8 inches',
          weight: '31 lbs/ft',
          flangeWidth: '8 inches',
          webThickness: '0.285 inches',
          grade: 'A992'
        },
        dimensions: {
          length: 240,
          width: 8,
          height: 8,
          unit: 'inches'
        },
        weight: 620.0,
        certifications: ['AISC', 'ASTM A992'],
        stockQuantity: 150,
        leadTime: 21,
        complianceStandards: ['AISC', 'ASTM A992', 'AWS D1.1'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.9,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Fiberglass Insulation R-19',
        description: 'Thermal insulation for residential and commercial buildings',
        category: 'Construction Materials',
        subcategory: 'Insulation',
        sku: 'INSUL-R19-FG',
        manufacturer: 'Owens Corning',
        model: 'R-19 Fiberglass',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fbd6c327e075?w=400',
        unitPrice: 58.99,
        minOrderQty: 10,
        maxOrderQty: 500,
        specifications: {
          rValue: 'R-19',
          thickness: '6.25 inches',
          width: '15 inches',
          length: '93 inches',
          coverage: '48 sq ft'
        },
        dimensions: {
          length: 93,
          width: 15,
          height: 6.25,
          unit: 'inches'
        },
        weight: 12.5,
        certifications: ['GREENGUARD Gold', 'ENERGY STAR'],
        stockQuantity: 400,
        leadTime: 7,
        complianceStandards: ['ASTM C665', 'NAIMA'],
        qualityRatings: {
          reliability: 4.3,
          performance: 4.4,
          support: 4.0
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Asphalt Roofing Shingles',
        description: 'Architectural asphalt shingles for residential roofing',
        category: 'Construction Materials',
        subcategory: 'Roofing',
        sku: 'SHINGLE-ARCH-25',
        manufacturer: 'GAF',
        model: 'Timberline HD',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
        unitPrice: 115.00,
        minOrderQty: 5,
        maxOrderQty: 200,
        specifications: {
          warranty: '25 years',
          coverage: '33.3 sq ft per bundle',
          weight: '240 lbs per square',
          windRating: '130 mph',
          fireRating: 'Class A'
        },
        dimensions: {
          length: 13.25,
          width: 12.5,
          height: 0.5,
          unit: 'inches'
        },
        weight: 80.0,
        certifications: ['UL', 'ASTM D3462', 'ICC-ES'],
        stockQuantity: 300,
        leadTime: 14,
        complianceStandards: ['ASTM D3462', 'UL 997', 'ASTM D7158'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'PVC Pipe 4" Schedule 40',
        description: 'PVC pipe for drainage and plumbing applications',
        category: 'Construction Materials',
        subcategory: 'Plumbing',
        sku: 'PVC-4-SCH40',
        manufacturer: 'Charlotte Pipe',
        model: 'Schedule 40',
        unitPrice: 22.50,
        minOrderQty: 10,
        maxOrderQty: 500,
        specifications: {
          diameter: '4 inches',
          schedule: 'Schedule 40',
          length: '10 feet',
          material: 'PVC',
          pressure: '220 psi'
        },
        dimensions: {
          length: 120,
          width: 4,
          height: 4,
          unit: 'inches'
        },
        weight: 8.5,
        certifications: ['NSF', 'ASTM D1785'],
        stockQuantity: 600,
        leadTime: 5,
        complianceStandards: ['ASTM D1785', 'NSF/ANSI 14'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.3,
          support: 4.1
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Electrical Conduit 1/2" EMT',
        description: 'Electrical metallic tubing for wire protection',
        category: 'Construction Materials',
        subcategory: 'Electrical',
        sku: 'EMT-12-10FT',
        manufacturer: 'Republic Steel',
        model: 'EMT 1/2"',
        imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
        unitPrice: 8.75,
        minOrderQty: 25,
        maxOrderQty: 1000,
        specifications: {
          diameter: '1/2 inch',
          length: '10 feet',
          material: 'Galvanized steel',
          thickness: '0.042 inches',
          finish: 'Galvanized'
        },
        dimensions: {
          length: 120,
          width: 0.5,
          height: 0.5,
          unit: 'inches'
        },
        weight: 1.2,
        certifications: ['UL', 'ANSI C80.3'],
        stockQuantity: 800,
        leadTime: 7,
        complianceStandards: ['UL 797', 'ANSI C80.3'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.4,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: constructionVendor.id,
        name: 'Drywall Sheets 1/2" x 4x8',
        description: 'Gypsum drywall for interior wall construction',
        category: 'Construction Materials',
        subcategory: 'Drywall',
        sku: 'DRYWALL-12-4X8',
        manufacturer: 'USG',
        model: 'Sheetrock',
        unitPrice: 16.99,
        minOrderQty: 20,
        maxOrderQty: 1000,
        specifications: {
          thickness: '1/2 inch',
          size: '4x8 feet',
          type: 'Regular',
          edgeType: 'Tapered',
          fireRating: 'Type X available'
        },
        dimensions: {
          length: 96,
          width: 48,
          height: 0.5,
          unit: 'inches'
        },
        weight: 57.0,
        certifications: ['ASTM C1396', 'UL'],
        stockQuantity: 500,
        leadTime: 3,
        complianceStandards: ['ASTM C1396', 'ASTM C840'],
        qualityRatings: {
          reliability: 4.3,
          performance: 4.2,
          support: 4.0
        }
      }
    })
  ]);

  // Create products for Industrial Equipment Solutions (Manufacturing)
  const manufacturingProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'CNC Vertical Milling Machine',
        description: 'High-precision vertical milling machine for manufacturing operations',
        category: 'Manufacturing',
        subcategory: 'Machine Tools',
        sku: 'CNC-VM-3000',
        manufacturer: 'Haas Automation',
        model: 'VF-3',
        imageUrl: 'https://images.unsplash.com/photo-1581092795442-6d6d5a7a2b9e?w=400',
        unitPrice: 89999.99,
        minOrderQty: 1,
        maxOrderQty: 10,
        specifications: {
          travelX: '40 inches',
          travelY: '20 inches',
          travelZ: '25 inches',
          spindle: '7500 RPM',
          toolChanger: '20 position ATC'
        },
        dimensions: {
          length: 98,
          width: 88,
          height: 96,
          unit: 'inches'
        },
        weight: 6500.0,
        certifications: ['CE', 'ISO 9001'],
        stockQuantity: 5,
        leadTime: 90,
        complianceStandards: ['CE', 'UL', 'CSA'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.9,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Industrial Air Compressor',
        description: 'Two-stage air compressor for manufacturing applications',
        category: 'Manufacturing',
        subcategory: 'Air Systems',
        sku: 'COMP-IND-175',
        manufacturer: 'Ingersoll Rand',
        model: 'SS3L3',
        imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
        unitPrice: 2499.99,
        minOrderQty: 1,
        maxOrderQty: 25,
        specifications: {
          capacity: '175 PSI',
          cfm: '11.5 CFM',
          tank: '60 gallon',
          motor: '3.7 HP',
          stages: 'Two-stage'
        },
        dimensions: {
          length: 65,
          width: 24,
          height: 50,
          unit: 'inches'
        },
        weight: 385.0,
        certifications: ['UL', 'CSA', 'ASME'],
        stockQuantity: 15,
        leadTime: 21,
        complianceStandards: ['UL', 'CSA', 'ASME'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Forklift Electric 4000lb',
        description: 'Electric forklift with 4000lb lifting capacity',
        category: 'Manufacturing',
        subcategory: 'Material Handling',
        sku: 'FORK-ELEC-4000',
        manufacturer: 'Toyota',
        model: '8FGCU25',
        imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400',
        unitPrice: 32999.99,
        minOrderQty: 1,
        maxOrderQty: 5,
        specifications: {
          capacity: '4000 lbs',
          lift: '188 inches',
          battery: '48V',
          runtime: '8 hours',
          turning: '82 inches'
        },
        dimensions: {
          length: 108,
          width: 42,
          height: 82,
          unit: 'inches'
        },
        weight: 8500.0,
        certifications: ['OSHA', 'CE', 'ISO 9001'],
        stockQuantity: 8,
        leadTime: 45,
        complianceStandards: ['OSHA', 'CE', 'ANSI'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Conveyor Belt System',
        description: 'Modular conveyor belt system for assembly lines',
        category: 'Manufacturing',
        subcategory: 'Conveyors',
        sku: 'CONV-MOD-20FT',
        manufacturer: 'Dorner',
        model: '2200 Series',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        unitPrice: 4599.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          length: '20 feet',
          width: '6 inches',
          speed: '0-65 FPM',
          load: '75 lbs/ft',
          motor: '1/8 HP'
        },
        dimensions: {
          length: 240,
          width: 6,
          height: 36,
          unit: 'inches'
        },
        weight: 185.0,
        certifications: ['UL', 'CE', 'CSA'],
        stockQuantity: 12,
        leadTime: 28,
        complianceStandards: ['UL', 'CE', 'CSA'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Welding Station MIG/TIG',
        description: 'Multi-process welding station for manufacturing',
        category: 'Manufacturing',
        subcategory: 'Welding Equipment',
        sku: 'WELD-MIG-TIG-300',
        manufacturer: 'Lincoln Electric',
        model: 'Power MIG 350MP',
        imageUrl: 'https://images.unsplash.com/photo-1581092916956-e8b7a96b0c8d?w=400',
        unitPrice: 3299.99,
        minOrderQty: 1,
        maxOrderQty: 20,
        specifications: {
          processes: 'MIG/TIG/Stick',
          amperage: '350A',
          voltage: '208-575V',
          wireFeeder: 'Integrated',
          cooling: 'Fan-cooled'
        },
        dimensions: {
          length: 38,
          width: 22,
          height: 35,
          unit: 'inches'
        },
        weight: 215.0,
        certifications: ['CSA', 'CE', 'CCC'],
        stockQuantity: 10,
        leadTime: 14,
        complianceStandards: ['CSA', 'CE', 'NEMA'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.8,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Hydraulic Press 50 Ton',
        description: 'Heavy-duty hydraulic press for forming operations',
        category: 'Manufacturing',
        subcategory: 'Forming Equipment',
        sku: 'PRESS-HYD-50T',
        manufacturer: 'JET',
        model: 'JHP-50',
        imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=400',
        unitPrice: 8999.99,
        minOrderQty: 1,
        maxOrderQty: 10,
        specifications: {
          capacity: '50 tons',
          working: '24 inches',
          daylight: '30 inches',
          table: '18 x 12 inches',
          motor: '2 HP'
        },
        dimensions: {
          length: 36,
          width: 24,
          height: 84,
          unit: 'inches'
        },
        weight: 1850.0,
        certifications: ['CSA', 'CE'],
        stockQuantity: 6,
        leadTime: 35,
        complianceStandards: ['CSA', 'CE', 'OSHA'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Laser Cutting Machine',
        description: 'CO2 laser cutting system for sheet metal fabrication',
        category: 'Manufacturing',
        subcategory: 'Laser Equipment',
        sku: 'LASER-CO2-150W',
        manufacturer: 'Trumpf',
        model: 'TruLaser 3030',
        imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400',
        unitPrice: 185999.99,
        minOrderQty: 1,
        maxOrderQty: 3,
        specifications: {
          laser: '150W CO2',
          cutting: '60 x 120 inches',
          thickness: '0.5 inch steel',
          speed: '1200 IPM',
          automation: 'Automatic nesting'
        },
        dimensions: {
          length: 200,
          width: 120,
          height: 96,
          unit: 'inches'
        },
        weight: 15000.0,
        certifications: ['CE', 'FDA', 'ISO 9001'],
        stockQuantity: 2,
        leadTime: 120,
        complianceStandards: ['CE', 'FDA', 'OSHA'],
        qualityRatings: {
          reliability: 4.9,
          performance: 4.9,
          support: 4.8
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Overhead Crane 5 Ton',
        description: 'Bridge crane for heavy lifting in manufacturing',
        category: 'Manufacturing',
        subcategory: 'Cranes',
        sku: 'CRANE-OH-5T',
        manufacturer: 'Gorbel',
        model: 'GS-5000',
        imageUrl: 'https://images.unsplash.com/photo-1581092916956-e8b7a96b0c8d?w=400',
        unitPrice: 24999.99,
        minOrderQty: 1,
        maxOrderQty: 5,
        specifications: {
          capacity: '5 tons',
          span: '30 feet',
          lift: '20 feet',
          hoist: 'Electric chain',
          controls: 'Pendant/Radio'
        },
        dimensions: {
          length: 360,
          width: 144,
          height: 240,
          unit: 'inches'
        },
        weight: 4500.0,
        certifications: ['OSHA', 'ASME B30.2', 'CSA'],
        stockQuantity: 3,
        leadTime: 60,
        complianceStandards: ['OSHA', 'ASME B30.2', 'CSA'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Industrial Workbench',
        description: 'Heavy-duty workbench for manufacturing operations',
        category: 'Manufacturing',
        subcategory: 'Workbenches',
        sku: 'BENCH-IND-8FT',
        manufacturer: 'Global Industrial',
        model: 'HD-8048',
        imageUrl: 'https://images.unsplash.com/photo-1581092795442-6d6d5a7a2b9e?w=400',
        unitPrice: 1299.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          size: '96 x 48 inches',
          height: '34 inches',
          capacity: '5000 lbs',
          top: 'Steel plate',
          storage: 'Lower shelf'
        },
        dimensions: {
          length: 96,
          width: 48,
          height: 34,
          unit: 'inches'
        },
        weight: 385.0,
        certifications: ['ANSI', 'OSHA'],
        stockQuantity: 25,
        leadTime: 14,
        complianceStandards: ['ANSI', 'OSHA'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.2
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: manufacturingVendor.id,
        name: 'Parts Washer Industrial',
        description: 'Solvent-based parts washer for manufacturing cleaning',
        category: 'Manufacturing',
        subcategory: 'Cleaning Equipment',
        sku: 'WASH-PARTS-40G',
        manufacturer: 'Graymills',
        model: 'T-40',
        imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
        unitPrice: 2199.99,
        minOrderQty: 1,
        maxOrderQty: 15,
        specifications: {
          tank: '40 gallons',
          pump: '1/4 HP',
          filter: 'Bag filtration',
          material: 'Steel construction',
          safety: 'Fusible link'
        },
        dimensions: {
          length: 48,
          width: 24,
          height: 36,
          unit: 'inches'
        },
        weight: 185.0,
        certifications: ['UL', 'CSA', 'OSHA'],
        stockQuantity: 18,
        leadTime: 21,
        complianceStandards: ['UL', 'CSA', 'OSHA'],
        qualityRatings: {
          reliability: 4.3,
          performance: 4.4,
          support: 4.1
        }
      }
    })
  ]);

  // Create products for Strategic Advisory Group (Consulting)
  const consultingProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Digital Transformation Strategy',
        description: 'Comprehensive digital transformation consulting for enterprise organizations',
        category: 'Consulting',
        subcategory: 'Digital Strategy',
        sku: 'DTS-ENTERPRISE',
        manufacturer: 'Strategic Advisory Group',
        model: 'Enterprise Package',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
        unitPrice: 15000.00,
        minOrderQty: 1,
        maxOrderQty: 5,
        specifications: {
          duration: '12 weeks',
          deliverables: 'Strategy roadmap, implementation plan, risk assessment',
          team: 'Senior consultants, technology architects',
          methodology: 'Agile transformation framework',
          industries: 'Finance, Healthcare, Manufacturing'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['PMP', 'TOGAF', 'SAFe'],
        stockQuantity: 10,
        leadTime: 14,
        complianceStandards: ['ISO 9001', 'GDPR', 'SOX'],
        qualityRatings: {
          expertise: 4.8,
          delivery: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Business Process Optimization',
        description: 'End-to-end business process analysis and optimization consulting',
        category: 'Consulting',
        subcategory: 'Process Improvement',
        sku: 'BPO-OPTIMIZE',
        manufacturer: 'Strategic Advisory Group',
        model: 'Process Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        unitPrice: 8500.00,
        minOrderQty: 1,
        maxOrderQty: 10,
        specifications: {
          duration: '8 weeks',
          deliverables: 'Process maps, efficiency metrics, improvement recommendations',
          team: 'Process analysts, lean specialists',
          methodology: 'Lean Six Sigma',
          focus: 'Cost reduction, quality improvement'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Six Sigma Black Belt', 'Lean Master'],
        stockQuantity: 15,
        leadTime: 7,
        complianceStandards: ['ISO 9001', 'CMMI'],
        qualityRatings: {
          expertise: 4.7,
          delivery: 4.8,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Cybersecurity Assessment',
        description: 'Comprehensive cybersecurity risk assessment and mitigation planning',
        category: 'Consulting',
        subcategory: 'Security Consulting',
        sku: 'CSA-ASSESSMENT',
        manufacturer: 'Strategic Advisory Group',
        model: 'Security Audit Plus',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
        unitPrice: 12000.00,
        minOrderQty: 1,
        maxOrderQty: 8,
        specifications: {
          duration: '6 weeks',
          deliverables: 'Security assessment report, remediation roadmap, policy recommendations',
          team: 'Certified security professionals, penetration testers',
          methodology: 'NIST Cybersecurity Framework',
          scope: 'Network, applications, data, processes'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['CISSP', 'CISM', 'CEH'],
        stockQuantity: 8,
        leadTime: 10,
        complianceStandards: ['NIST', 'ISO 27001', 'SOC 2'],
        qualityRatings: {
          expertise: 4.9,
          delivery: 4.6,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Change Management Program',
        description: 'Organizational change management and employee adoption consulting',
        category: 'Consulting',
        subcategory: 'Change Management',
        sku: 'CMP-PROGRAM',
        manufacturer: 'Strategic Advisory Group',
        model: 'Change Leadership',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
        unitPrice: 9500.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          duration: '10 weeks',
          deliverables: 'Change strategy, communication plan, training materials',
          team: 'Change specialists, organizational psychologists',
          methodology: 'Kotter 8-Step Process',
          focus: 'Employee engagement, resistance management'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Prosci', 'ACMP'],
        stockQuantity: 12,
        leadTime: 5,
        complianceStandards: ['ISO 45001', 'OHSAS 18001'],
        qualityRatings: {
          expertise: 4.6,
          delivery: 4.8,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Supply Chain Optimization',
        description: 'End-to-end supply chain analysis and optimization consulting',
        category: 'Consulting',
        subcategory: 'Supply Chain',
        sku: 'SCO-OPTIMIZE',
        manufacturer: 'Strategic Advisory Group',
        model: 'Supply Chain Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        unitPrice: 11000.00,
        minOrderQty: 1,
        maxOrderQty: 6,
        specifications: {
          duration: '14 weeks',
          deliverables: 'Supply chain mapping, cost analysis, optimization roadmap',
          team: 'Supply chain experts, logistics analysts',
          methodology: 'SCOR model, lean principles',
          focus: 'Cost reduction, risk mitigation, efficiency'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['CSCP', 'CPIM', 'CLTD'],
        stockQuantity: 6,
        leadTime: 14,
        complianceStandards: ['ISO 9001', 'ISO 28000'],
        qualityRatings: {
          expertise: 4.8,
          delivery: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Data Analytics Strategy',
        description: 'Data-driven decision making and analytics implementation consulting',
        category: 'Consulting',
        subcategory: 'Data Strategy',
        sku: 'DAS-STRATEGY',
        manufacturer: 'Strategic Advisory Group',
        model: 'Analytics Transformation',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        unitPrice: 13500.00,
        minOrderQty: 1,
        maxOrderQty: 7,
        specifications: {
          duration: '12 weeks',
          deliverables: 'Data strategy, analytics roadmap, governance framework',
          team: 'Data scientists, analytics consultants',
          methodology: 'CRISP-DM, Agile analytics',
          focus: 'Data governance, predictive analytics, visualization'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Certified Analytics Professional', 'Data Management Professional'],
        stockQuantity: 7,
        leadTime: 12,
        complianceStandards: ['GDPR', 'CCPA', 'HIPAA'],
        qualityRatings: {
          expertise: 4.9,
          delivery: 4.7,
          support: 4.8
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Risk Management Framework',
        description: 'Enterprise risk management framework design and implementation',
        category: 'Consulting',
        subcategory: 'Risk Management',
        sku: 'RMF-FRAMEWORK',
        manufacturer: 'Strategic Advisory Group',
        model: 'Risk Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
        unitPrice: 10500.00,
        minOrderQty: 1,
        maxOrderQty: 8,
        specifications: {
          duration: '10 weeks',
          deliverables: 'Risk framework, assessment tools, monitoring dashboard',
          team: 'Risk specialists, compliance experts',
          methodology: 'COSO ERM, ISO 31000',
          focus: 'Risk identification, assessment, mitigation'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['FRM', 'PRM', 'CRM'],
        stockQuantity: 8,
        leadTime: 8,
        complianceStandards: ['SOX', 'COSO', 'ISO 31000'],
        qualityRatings: {
          expertise: 4.7,
          delivery: 4.6,
          support: 4.8
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Organizational Restructuring',
        description: 'Strategic organizational design and restructuring consulting',
        category: 'Consulting',
        subcategory: 'Organizational Design',
        sku: 'ORG-RESTRUCTURE',
        manufacturer: 'Strategic Advisory Group',
        model: 'Organizational Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
        unitPrice: 14000.00,
        minOrderQty: 1,
        maxOrderQty: 5,
        specifications: {
          duration: '16 weeks',
          deliverables: 'Organizational design, role definitions, transition plan',
          team: 'Organizational consultants, HR specialists',
          methodology: 'Galbraith Star Model',
          focus: 'Structure optimization, role clarity, efficiency'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['SHRM', 'SPHR', 'OD Certificate'],
        stockQuantity: 5,
        leadTime: 21,
        complianceStandards: ['EEOC', 'FLSA', 'ADA'],
        qualityRatings: {
          expertise: 4.8,
          delivery: 4.5,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Merger & Acquisition Support',
        description: 'Due diligence and integration support for M&A transactions',
        category: 'Consulting',
        subcategory: 'M&A Advisory',
        sku: 'MA-SUPPORT',
        manufacturer: 'Strategic Advisory Group',
        model: 'M&A Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400',
        unitPrice: 25000.00,
        minOrderQty: 1,
        maxOrderQty: 3,
        specifications: {
          duration: '20 weeks',
          deliverables: 'Due diligence report, integration plan, synergy analysis',
          team: 'M&A specialists, financial analysts, integration managers',
          methodology: 'McKinsey M&A playbook',
          focus: 'Value creation, risk mitigation, cultural integration'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['CFA', 'MBA', 'M&A Professional'],
        stockQuantity: 3,
        leadTime: 30,
        complianceStandards: ['SEC', 'SOX', 'GAAP'],
        qualityRatings: {
          expertise: 4.9,
          delivery: 4.6,
          support: 4.8
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: consultingVendor.id,
        name: 'Performance Management System',
        description: 'Design and implementation of comprehensive performance management systems',
        category: 'Consulting',
        subcategory: 'Performance Management',
        sku: 'PMS-SYSTEM',
        manufacturer: 'Strategic Advisory Group',
        model: 'Performance Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1543269664-647b9467bb39?w=400',
        unitPrice: 7500.00,
        minOrderQty: 1,
        maxOrderQty: 15,
        specifications: {
          duration: '8 weeks',
          deliverables: 'Performance framework, KPI dashboard, review processes',
          team: 'HR consultants, performance specialists',
          methodology: 'Balanced Scorecard, OKR framework',
          focus: 'Goal alignment, performance tracking, continuous improvement'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['SHRM', 'PHR', 'Performance Management Certificate'],
        stockQuantity: 15,
        leadTime: 7,
        complianceStandards: ['EEOC', 'FLSA'],
        qualityRatings: {
          expertise: 4.6,
          delivery: 4.8,
          support: 4.7
        }
      }
    })
  ]);

  // Create products for MedTech Solutions Inc (Healthcare)
  const healthcareProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Digital Blood Pressure Monitor',
        description: 'Automatic digital blood pressure monitor with large LCD display',
        category: 'Healthcare',
        subcategory: 'Monitoring Devices',
        sku: 'DBP-MONITOR-001',
        manufacturer: 'Omron',
        model: 'BP7100',
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        unitPrice: 89.99,
        minOrderQty: 10,
        maxOrderQty: 500,
        specifications: {
          type: 'Automatic Digital',
          cuffSize: 'Standard Adult',
          memory: '60 readings',
          connectivity: 'Bluetooth',
          accuracy: '±3mmHg'
        },
        dimensions: {
          length: 5.1,
          width: 3.6,
          height: 2.8,
          unit: 'inches'
        },
        weight: 0.8,
        certifications: ['FDA', 'CE', 'ISO 13485'],
        stockQuantity: 250,
        leadTime: 7,
        complianceStandards: ['FDA', 'CE', 'ISO 13485', 'HIPAA'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.6,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Disposable Surgical Masks',
        description: 'Level 1 disposable surgical masks, 50 pack',
        category: 'Healthcare',
        subcategory: 'PPE',
        sku: 'SURG-MASK-50',
        manufacturer: 'Medline',
        model: 'NON27375',
        imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400',
        unitPrice: 24.99,
        minOrderQty: 50,
        maxOrderQty: 10000,
        specifications: {
          type: 'Surgical Level 1',
          material: 'Polypropylene',
          packaging: '50 per box',
          breathability: 'High',
          filtration: 'BFE ≥95%'
        },
        dimensions: {
          length: 7.0,
          width: 3.5,
          height: 0.1,
          unit: 'inches'
        },
        weight: 0.02,
        certifications: ['FDA', 'CE', 'ASTM F2100'],
        stockQuantity: 5000,
        leadTime: 3,
        complianceStandards: ['FDA', 'CE', 'ASTM F2100'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Pulse Oximeter',
        description: 'Fingertip pulse oximeter with OLED display',
        category: 'Healthcare',
        subcategory: 'Monitoring Devices',
        sku: 'PULSE-OX-FT',
        manufacturer: 'Masimo',
        model: 'MightySat',
        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
        unitPrice: 299.99,
        minOrderQty: 5,
        maxOrderQty: 200,
        specifications: {
          type: 'Fingertip',
          display: 'OLED Color',
          accuracy: '±2% SpO2',
          battery: 'AAA x2',
          bluetooth: 'Yes'
        },
        dimensions: {
          length: 2.3,
          width: 1.5,
          height: 1.2,
          unit: 'inches'
        },
        weight: 0.15,
        certifications: ['FDA', 'CE', 'ISO 80601-2-61'],
        stockQuantity: 150,
        leadTime: 5,
        complianceStandards: ['FDA', 'CE', 'ISO 80601-2-61'],
        qualityRatings: {
          reliability: 4.9,
          performance: 4.8,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Examination Table',
        description: 'Adjustable height examination table with paper roll holder',
        category: 'Healthcare',
        subcategory: 'Furniture',
        sku: 'EXAM-TABLE-ADJ',
        manufacturer: 'Winco',
        model: '8570',
        imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400',
        unitPrice: 1899.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          type: 'Adjustable Height',
          height: '27-37 inches',
          width: '27 inches',
          weight: '300 lbs capacity',
          upholstery: 'Vinyl'
        },
        dimensions: {
          length: 72,
          width: 27,
          height: 32,
          unit: 'inches'
        },
        weight: 85.0,
        certifications: ['FDA', 'UL', 'Greenguard'],
        stockQuantity: 25,
        leadTime: 14,
        complianceStandards: ['FDA', 'UL', 'CAL TB 117'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Stethoscope',
        description: 'Cardiology stethoscope with dual head',
        category: 'Healthcare',
        subcategory: 'Diagnostic Equipment',
        sku: 'STETH-CARD-001',
        manufacturer: 'Littmann',
        model: 'Cardiology IV',
        imageUrl: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=400',
        unitPrice: 359.99,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          type: 'Cardiology',
          head: 'Dual Head',
          tubing: 'Latex-free',
          length: '27 inches',
          warranty: '7 years'
        },
        dimensions: {
          length: 27,
          width: 0.75,
          height: 2.5,
          unit: 'inches'
        },
        weight: 0.31,
        certifications: ['FDA', 'CE', 'ISO 13485'],
        stockQuantity: 75,
        leadTime: 3,
        complianceStandards: ['FDA', 'CE', 'ISO 13485'],
        qualityRatings: {
          reliability: 4.9,
          performance: 4.8,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Wheelchair Manual',
        description: 'Lightweight manual wheelchair with removable armrests',
        category: 'Healthcare',
        subcategory: 'Mobility Equipment',
        sku: 'WHEEL-MANUAL-LW',
        manufacturer: 'Drive Medical',
        model: 'Cruiser III',
        imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400',
        unitPrice: 199.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          type: 'Manual',
          seatWidth: '20 inches',
          weight: '35 lbs',
          capacity: '300 lbs',
          wheels: 'Mag wheels'
        },
        dimensions: {
          length: 42,
          width: 25,
          height: 36,
          unit: 'inches'
        },
        weight: 35.0,
        certifications: ['FDA', 'CE', 'ISO 7176'],
        stockQuantity: 40,
        leadTime: 10,
        complianceStandards: ['FDA', 'CE', 'ISO 7176'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Defibrillator AED',
        description: 'Automated external defibrillator with voice prompts',
        category: 'Healthcare',
        subcategory: 'Emergency Equipment',
        sku: 'AED-AUTO-001',
        manufacturer: 'Philips',
        model: 'HeartStart FRx',
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        unitPrice: 1599.99,
        minOrderQty: 1,
        maxOrderQty: 25,
        specifications: {
          type: 'Automated External',
          energy: '150J',
          voice: 'Multilingual',
          battery: '5-year shelf life',
          shock: 'Biphasic'
        },
        dimensions: {
          length: 8.9,
          width: 2.4,
          height: 9.9,
          unit: 'inches'
        },
        weight: 3.5,
        certifications: ['FDA', 'CE', 'AHA Guidelines'],
        stockQuantity: 15,
        leadTime: 7,
        complianceStandards: ['FDA', 'CE', 'AHA Guidelines'],
        qualityRatings: {
          reliability: 4.9,
          performance: 4.9,
          support: 4.8
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Surgical Instruments Set',
        description: 'Basic surgical instruments set, 25 pieces',
        category: 'Healthcare',
        subcategory: 'Surgical Equipment',
        sku: 'SURG-SET-25',
        manufacturer: 'Medline',
        model: 'MDS3202',
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        unitPrice: 449.99,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          pieces: '25 instruments',
          material: 'Stainless steel',
          grade: 'German grade',
          finish: 'Satin finish',
          sterilizable: 'Yes'
        },
        dimensions: {
          length: 12,
          width: 8,
          height: 2,
          unit: 'inches'
        },
        weight: 2.5,
        certifications: ['FDA', 'CE', 'ISO 13485'],
        stockQuantity: 50,
        leadTime: 5,
        complianceStandards: ['FDA', 'CE', 'ISO 13485'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'IV Infusion Pump',
        description: 'Programmable IV infusion pump with safety features',
        category: 'Healthcare',
        subcategory: 'Infusion Equipment',
        sku: 'IV-PUMP-PROG',
        manufacturer: 'Baxter',
        model: 'Colleague CX',
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        unitPrice: 2999.99,
        minOrderQty: 1,
        maxOrderQty: 20,
        specifications: {
          type: 'Programmable',
          accuracy: '±5%',
          occlusion: 'Yes',
          battery: '6 hours',
          drugLibrary: 'Yes'
        },
        dimensions: {
          length: 6.5,
          width: 4.5,
          height: 12,
          unit: 'inches'
        },
        weight: 7.2,
        certifications: ['FDA', 'CE', 'ISO 60601-2-24'],
        stockQuantity: 12,
        leadTime: 14,
        complianceStandards: ['FDA', 'CE', 'ISO 60601-2-24'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.9,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: healthcareVendor.id,
        name: 'Medical Scales',
        description: 'Digital medical scale with BMI calculation',
        category: 'Healthcare',
        subcategory: 'Measurement Equipment',
        sku: 'SCALE-MED-BMI',
        manufacturer: 'Detecto',
        model: 'D1130',
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        unitPrice: 599.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          type: 'Digital',
          capacity: '550 lbs',
          accuracy: '±0.1 lbs',
          bmi: 'Yes',
          connectivity: 'USB'
        },
        dimensions: {
          length: 14,
          width: 13,
          height: 2.5,
          unit: 'inches'
        },
        weight: 15.0,
        certifications: ['FDA', 'CE', 'NTEP'],
        stockQuantity: 35,
        leadTime: 7,
        complianceStandards: ['FDA', 'CE', 'NTEP'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.4
        }
      }
    })
  ]);


  console.log('Database seeded successfully!');
  console.log(`Created ${techProducts.length} products for TechPro Solutions`);
  console.log(`Created ${officeProducts.length} products for Office Essentials Inc`);
  console.log(`Created ${constructionProducts.length} products for BuildRight Materials`);
  console.log(`Created ${manufacturingProducts.length} products for Industrial Equipment Solutions`);
  console.log(`Created ${consultingProducts.length} products for Strategic Advisory Group`);
  console.log(`Created ${healthcareProducts.length} products for MedTech Solutions Inc`);

  // Create products for EduTech Resources (Education)
  const educationProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Interactive Whiteboard',
        description: 'Smart interactive whiteboard with touch screen technology',
        category: 'Education',
        subcategory: 'Classroom Technology',
        sku: 'IWB-SMART-87',
        manufacturer: 'SMART Technologies',
        model: 'SMART Board 7087',
        imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
        unitPrice: 3499.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          size: '87 inches',
          resolution: '4K UHD',
          connectivity: 'HDMI, USB, WiFi',
          touch: 'Multi-touch',
          software: 'SMART Notebook'
        },
        dimensions: {
          length: 77.2,
          width: 43.4,
          height: 3.2,
          unit: 'inches'
        },
        weight: 66.0,
        certifications: ['CE', 'FCC', 'Energy Star'],
        stockQuantity: 25,
        leadTime: 14,
        complianceStandards: ['CE', 'FCC', 'RoHS'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.8,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Student Laptop Cart',
        description: 'Mobile laptop cart with charging station for 32 devices',
        category: 'Education',
        subcategory: 'Storage & Charging',
        sku: 'CART-LAPTOP-32',
        manufacturer: 'Spectrum Industries',
        model: 'Connect 32',
        imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        unitPrice: 1899.99,
        minOrderQty: 1,
        maxOrderQty: 20,
        specifications: {
          capacity: '32 laptops',
          charging: 'Individual outlets',
          security: 'Locking doors',
          mobility: 'Heavy-duty casters',
          ventilation: 'Cooling vents'
        },
        dimensions: {
          length: 26,
          width: 20,
          height: 42,
          unit: 'inches'
        },
        weight: 125.0,
        certifications: ['UL', 'Greenguard Gold'],
        stockQuantity: 15,
        leadTime: 21,
        complianceStandards: ['UL', 'BIFMA', 'Greenguard'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Document Camera',
        description: 'High-resolution document camera with LED lighting',
        category: 'Education',
        subcategory: 'Presentation Tools',
        sku: 'DOC-CAM-HD',
        manufacturer: 'ELMO',
        model: 'MO-1',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
        unitPrice: 599.99,
        minOrderQty: 1,
        maxOrderQty: 100,
        specifications: {
          resolution: '1080p Full HD',
          zoom: '16x optical',
          lighting: 'LED illumination',
          output: 'HDMI, USB',
          capture: 'Image and video'
        },
        dimensions: {
          length: 10.2,
          width: 6.3,
          height: 14.6,
          unit: 'inches'
        },
        weight: 2.4,
        certifications: ['CE', 'FCC'],
        stockQuantity: 75,
        leadTime: 7,
        complianceStandards: ['CE', 'FCC', 'RoHS'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Student Desk Set',
        description: 'Adjustable student desk and chair set',
        category: 'Education',
        subcategory: 'Furniture',
        sku: 'DESK-SET-ADJ',
        manufacturer: 'Virco',
        model: '9000 Series',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
        unitPrice: 189.99,
        minOrderQty: 10,
        maxOrderQty: 500,
        specifications: {
          type: 'Adjustable height',
          desktop: 'Laminate surface',
          frame: 'Steel construction',
          chair: 'Ergonomic design',
          adjustment: 'Height adjustable'
        },
        dimensions: {
          length: 24,
          width: 18,
          height: 30,
          unit: 'inches'
        },
        weight: 35.0,
        certifications: ['Greenguard Gold', 'BIFMA'],
        stockQuantity: 200,
        leadTime: 14,
        complianceStandards: ['BIFMA', 'Greenguard', 'CAL TB 117'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Classroom Projector',
        description: 'Short-throw projector for classroom presentations',
        category: 'Education',
        subcategory: 'Presentation Equipment',
        sku: 'PROJ-ST-3500',
        manufacturer: 'Epson',
        model: 'PowerLite 685W',
        imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        unitPrice: 649.99,
        minOrderQty: 1,
        maxOrderQty: 75,
        specifications: {
          brightness: '3500 lumens',
          resolution: 'WXGA',
          throw: 'Short throw',
          connectivity: 'HDMI, WiFi, USB',
          lamp: '12000 hour life'
        },
        dimensions: {
          length: 11.7,
          width: 9.2,
          height: 2.4,
          unit: 'inches'
        },
        weight: 5.1,
        certifications: ['Energy Star', 'EPEAT Silver'],
        stockQuantity: 45,
        leadTime: 10,
        complianceStandards: ['FCC', 'Energy Star', 'RoHS'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Science Lab Equipment Set',
        description: 'Complete science laboratory equipment set for middle school',
        category: 'Education',
        subcategory: 'Lab Equipment',
        sku: 'LAB-SET-MS',
        manufacturer: 'Carolina Biological',
        model: 'Middle School Kit',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
        unitPrice: 1299.99,
        minOrderQty: 1,
        maxOrderQty: 25,
        specifications: {
          grade: 'Middle School',
          subjects: 'Biology, Chemistry, Physics',
          components: '150+ items',
          storage: 'Organized case',
          curriculum: 'Standards aligned'
        },
        dimensions: {
          length: 24,
          width: 18,
          height: 12,
          unit: 'inches'
        },
        weight: 25.0,
        certifications: ['AP College Board', 'NSTA'],
        stockQuantity: 30,
        leadTime: 14,
        complianceStandards: ['CPSC', 'NSTA Guidelines'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.8,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Educational Software License',
        description: 'Site license for educational software suite',
        category: 'Education',
        subcategory: 'Software',
        sku: 'SW-EDU-SITE',
        manufacturer: 'Adobe',
        model: 'Creative Suite Education',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        unitPrice: 2499.99,
        minOrderQty: 1,
        maxOrderQty: 10,
        specifications: {
          type: 'Site license',
          users: 'Unlimited',
          duration: '1 year',
          applications: 'Full Creative Suite',
          support: 'Technical support included'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Educational License'],
        stockQuantity: 50,
        leadTime: 1,
        complianceStandards: ['Educational License Agreement'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.9,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Tablet Set with Cases',
        description: 'Set of 25 tablets with protective cases for classroom use',
        category: 'Education',
        subcategory: 'Mobile Devices',
        sku: 'TABLET-SET-25',
        manufacturer: 'Apple',
        model: 'iPad 9th Generation',
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        unitPrice: 8749.99,
        minOrderQty: 1,
        maxOrderQty: 10,
        specifications: {
          quantity: '25 tablets',
          storage: '64GB each',
          screen: '10.2 inch',
          cases: 'Rugged protective cases',
          warranty: '1 year AppleCare'
        },
        dimensions: {
          length: 9.8,
          width: 6.8,
          height: 0.29,
          unit: 'inches'
        },
        weight: 1.07,
        certifications: ['FCC', 'CE', 'Energy Star'],
        stockQuantity: 8,
        leadTime: 7,
        complianceStandards: ['FCC', 'CE', 'RoHS'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.9,
          support: 4.7
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Classroom Audio System',
        description: 'Wireless classroom audio system with teacher microphone',
        category: 'Education',
        subcategory: 'Audio Equipment',
        sku: 'AUDIO-CLASS-WL',
        manufacturer: 'FrontRow',
        model: 'ezRoom',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        unitPrice: 899.99,
        minOrderQty: 1,
        maxOrderQty: 50,
        specifications: {
          type: 'Wireless',
          microphone: 'Teacher pendant mic',
          speakers: '4 ceiling speakers',
          range: 'Classroom coverage',
          battery: '8 hour life'
        },
        dimensions: {
          length: 8.5,
          width: 6.2,
          height: 1.8,
          unit: 'inches'
        },
        weight: 2.1,
        certifications: ['FCC', 'CE'],
        stockQuantity: 35,
        leadTime: 10,
        complianceStandards: ['FCC', 'CE', 'ADA'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: educationVendor.id,
        name: 'Library Book Scanner',
        description: 'High-speed book scanner for library digitization',
        category: 'Education',
        subcategory: 'Library Equipment',
        sku: 'SCAN-BOOK-HS',
        manufacturer: 'Plustek',
        model: 'OpticBook 4800',
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
        unitPrice: 449.99,
        minOrderQty: 1,
        maxOrderQty: 25,
        specifications: {
          type: 'Flatbed scanner',
          resolution: '1200x2400 dpi',
          speed: '12 seconds per page',
          format: 'PDF, JPEG, TIFF',
          size: 'A4 books'
        },
        dimensions: {
          length: 18.9,
          width: 12.6,
          height: 3.0,
          unit: 'inches'
        },
        weight: 8.8,
        certifications: ['CE', 'FCC'],
        stockQuantity: 20,
        leadTime: 7,
        complianceStandards: ['CE', 'FCC', 'RoHS'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.3
        }
      }
    })
  ]);

  console.log(`Created ${educationProducts.length} products for EduTech Resources`);

  // Create products for Universal Services Corp (Other category)
  const otherProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Professional Cleaning Service',
        description: 'Comprehensive commercial cleaning service for office buildings',
        category: 'Other',
        subcategory: 'Cleaning Services',
        sku: 'CLEAN-PROF-MON',
        manufacturer: 'Universal Services Corp',
        model: 'Professional Package',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fbd6c327e075?w=400',
        unitPrice: 2500.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          frequency: 'Monthly service',
          coverage: 'Up to 10,000 sq ft',
          services: 'General cleaning, sanitization, waste management',
          staff: 'Trained professionals',
          supplies: 'Eco-friendly products included'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['OSHA', 'Green Seal', 'ISSA'],
        stockQuantity: 50,
        leadTime: 7,
        complianceStandards: ['OSHA', 'EPA', 'Green Seal'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Security Guard Services',
        description: 'Professional security guard services for commercial facilities',
        category: 'Other',
        subcategory: 'Security Services',
        sku: 'SEC-GUARD-24H',
        manufacturer: 'Universal Services Corp',
        model: '24/7 Security Package',
        imageUrl: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=400',
        unitPrice: 4200.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          coverage: '24/7 monitoring',
          guards: 'Licensed security personnel',
          training: 'Certified and trained staff',
          equipment: 'Communication devices, flashlights',
          reporting: 'Daily incident reports'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Licensed Security Provider', 'Background Checked'],
        stockQuantity: 25,
        leadTime: 14,
        complianceStandards: ['State Security License', 'DOL'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Landscaping Services',
        description: 'Complete landscaping and grounds maintenance services',
        category: 'Other',
        subcategory: 'Landscaping',
        sku: 'LAND-MAINT-SEAS',
        manufacturer: 'Universal Services Corp',
        model: 'Seasonal Maintenance',
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        unitPrice: 1800.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          services: 'Mowing, trimming, fertilizing, seasonal cleanup',
          frequency: 'Weekly maintenance',
          coverage: 'Up to 5 acres',
          equipment: 'Professional grade tools',
          seasonal: 'Spring/fall cleanup included'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Licensed Landscaper', 'Pesticide Applicator'],
        stockQuantity: 30,
        leadTime: 10,
        complianceStandards: ['EPA Pesticide License', 'State Contractor License'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.4
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Waste Management Service',
        description: 'Commercial waste collection and recycling services',
        category: 'Other',
        subcategory: 'Waste Management',
        sku: 'WASTE-COMM-WK',
        manufacturer: 'Universal Services Corp',
        model: 'Commercial Weekly',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
        unitPrice: 450.00,
        minOrderQty: 1,
        maxOrderQty: 52,
        specifications: {
          frequency: 'Weekly pickup',
          containers: '2-yard dumpster',
          recycling: 'Cardboard, paper, plastics',
          service: 'Scheduled collection',
          disposal: 'Eco-friendly disposal'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['EPA Certified', 'Waste Management License'],
        stockQuantity: 100,
        leadTime: 3,
        complianceStandards: ['EPA', 'DOT', 'State Waste License'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.6,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Parking Lot Maintenance',
        description: 'Parking lot cleaning, sweeping, and maintenance services',
        category: 'Other',
        subcategory: 'Facility Maintenance',
        sku: 'PARK-MAINT-MON',
        manufacturer: 'Universal Services Corp',
        model: 'Monthly Maintenance',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        unitPrice: 850.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          services: 'Sweeping, power washing, striping',
          frequency: 'Monthly service',
          coverage: 'Up to 50 parking spaces',
          equipment: 'Professional sweepers, pressure washers',
          materials: 'Line striping paint included'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['DOT Certified', 'Traffic Control'],
        stockQuantity: 40,
        leadTime: 7,
        complianceStandards: ['DOT', 'OSHA', 'Municipal Permits'],
        qualityRatings: {
          reliability: 4.4,
          performance: 4.5,
          support: 4.3
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Document Shredding Service',
        description: 'Secure document destruction and shredding services',
        category: 'Other',
        subcategory: 'Document Services',
        sku: 'DOC-SHRED-SEC',
        manufacturer: 'Universal Services Corp',
        model: 'Secure Destruction',
        imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400',
        unitPrice: 125.00,
        minOrderQty: 1,
        maxOrderQty: 52,
        specifications: {
          security: 'NAID AAA Certified',
          method: 'Cross-cut shredding',
          pickup: 'Scheduled pickup service',
          certificate: 'Certificate of destruction',
          containers: 'Secure collection bins'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['NAID AAA', 'HIPAA Compliant'],
        stockQuantity: 75,
        leadTime: 5,
        complianceStandards: ['NAID', 'HIPAA', 'SOX'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Pest Control Services',
        description: 'Commercial pest control and extermination services',
        category: 'Other',
        subcategory: 'Pest Control',
        sku: 'PEST-CONT-QTR',
        manufacturer: 'Universal Services Corp',
        model: 'Quarterly Treatment',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fbd6c327e075?w=400',
        unitPrice: 350.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          frequency: 'Quarterly treatment',
          coverage: 'Interior and exterior',
          methods: 'Integrated pest management',
          chemicals: 'EPA approved pesticides',
          warranty: 'Service guarantee'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Licensed Pest Control', 'EPA Certified'],
        stockQuantity: 60,
        leadTime: 7,
        complianceStandards: ['EPA', 'State Pesticide License'],
        qualityRatings: {
          reliability: 4.6,
          performance: 4.7,
          support: 4.5
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'HVAC Maintenance Service',
        description: 'Heating, ventilation, and air conditioning maintenance services',
        category: 'Other',
        subcategory: 'HVAC Services',
        sku: 'HVAC-MAINT-BI',
        manufacturer: 'Universal Services Corp',
        model: 'Bi-Annual Service',
        imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
        unitPrice: 650.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          frequency: 'Bi-annual service',
          services: 'Filter replacement, system cleaning, inspection',
          systems: 'Up to 10 tons capacity',
          warranty: '6-month service warranty',
          emergency: '24/7 emergency service'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['HVAC License', 'EPA 608 Certified'],
        stockQuantity: 35,
        leadTime: 10,
        complianceStandards: ['EPA', 'State HVAC License'],
        qualityRatings: {
          reliability: 4.7,
          performance: 4.8,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Fire Safety Inspection',
        description: 'Annual fire safety inspection and compliance services',
        category: 'Other',
        subcategory: 'Safety Services',
        sku: 'FIRE-INSP-ANN',
        manufacturer: 'Universal Services Corp',
        model: 'Annual Inspection',
        imageUrl: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=400',
        unitPrice: 450.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          frequency: 'Annual inspection',
          coverage: 'Fire extinguishers, alarms, sprinklers',
          compliance: 'NFPA standards',
          documentation: 'Inspection certificates',
          training: 'Staff fire safety training'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['NFPA Certified', 'Fire Safety Inspector'],
        stockQuantity: 50,
        leadTime: 14,
        complianceStandards: ['NFPA', 'OSHA', 'Local Fire Code'],
        qualityRatings: {
          reliability: 4.8,
          performance: 4.7,
          support: 4.6
        }
      }
    }),
    prisma.product.create({
      data: {
        vendorId: otherVendor.id,
        name: 'Event Planning Services',
        description: 'Corporate event planning and coordination services',
        category: 'Other',
        subcategory: 'Event Services',
        sku: 'EVENT-CORP-PLAN',
        manufacturer: 'Universal Services Corp',
        model: 'Corporate Package',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
        unitPrice: 2200.00,
        minOrderQty: 1,
        maxOrderQty: 12,
        specifications: {
          services: 'Full event planning and coordination',
          capacity: 'Up to 200 attendees',
          includes: 'Venue, catering, A/V equipment',
          staff: 'Professional event coordinators',
          duration: 'Full day event'
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'inches'
        },
        weight: 0,
        certifications: ['Event Planning Certification', 'Food Safety'],
        stockQuantity: 20,
        leadTime: 21,
        complianceStandards: ['Food Safety', 'Liquor License'],
        qualityRatings: {
          reliability: 4.5,
          performance: 4.6,
          support: 4.7
        }
      }
    })
  ]);

  console.log(`Created ${otherProducts.length} products for Universal Services Corp`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });