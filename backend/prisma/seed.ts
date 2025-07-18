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

  console.log('Database seeded successfully!');
  console.log(`Created ${techProducts.length} products for TechPro Solutions`);
  console.log(`Created ${officeProducts.length} products for Office Essentials Inc`);
  console.log(`Created ${constructionProducts.length} products for BuildRight Materials`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });