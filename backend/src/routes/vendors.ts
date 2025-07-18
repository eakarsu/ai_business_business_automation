import express from 'express';

const router = express.Router();

// Mock vendor data
const vendors = [
  {
    id: 1,
    name: 'Tech Solutions Inc.',
    email: 'contact@techsolutions.com',
    phone: '+1-555-0123',
    address: '123 Tech Street, Silicon Valley, CA 94000',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Global Supply Co.',
    email: 'info@globalsupply.com',
    phone: '+1-555-0456',
    address: '456 Supply Ave, New York, NY 10001',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// Get all vendors
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: vendors
  });
});

// Get vendor by ID
router.get('/:id', (req, res) => {
  const vendor = vendors.find(v => v.id === parseInt(req.params.id));
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  return res.json({
    success: true,
    data: vendor
  });
});

// Create new vendor
router.post('/', (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }

  const newVendor = {
    id: vendors.length + 1,
    name,
    email,
    phone: phone || '',
    address: address || '',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  vendors.push(newVendor);

  return res.status(201).json({
    success: true,
    data: newVendor
  });
});

// Update vendor
router.put('/:id', (req, res) => {
  const vendorIndex = vendors.findIndex(v => v.id === parseInt(req.params.id));
  
  if (vendorIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  const { name, email, phone, address, status } = req.body;
  const currentVendor = vendors[vendorIndex];
  
  if (!currentVendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  
  vendors[vendorIndex] = {
    ...currentVendor,
    name: name || currentVendor.name,
    email: email || currentVendor.email,
    phone: phone || currentVendor.phone,
    address: address || currentVendor.address,
    status: status || currentVendor.status
  };

  return res.json({
    success: true,
    data: vendors[vendorIndex]
  });
});

// Delete vendor
router.delete('/:id', (req, res) => {
  const vendorIndex = vendors.findIndex(v => v.id === parseInt(req.params.id));
  
  if (vendorIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  vendors.splice(vendorIndex, 1);

  return res.json({
    success: true,
    message: 'Vendor deleted successfully'
  });
});

export default router;