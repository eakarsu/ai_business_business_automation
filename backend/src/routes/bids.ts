import express from 'express';

const router = express.Router();

// Mock bid data
const bids = [
  {
    id: 1,
    title: 'Software Development Services',
    description: 'Full-stack web development for procurement system',
    budget: 50000,
    deadline: '2024-12-31',
    status: 'open',
    vendorId: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Database Migration Services',
    description: 'Migration from legacy system to modern database',
    budget: 25000,
    deadline: '2024-11-30',
    status: 'in_progress',
    vendorId: 2,
    createdAt: new Date().toISOString()
  }
];

// Get all bids
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: bids
  });
});

// Get bid by ID
router.get('/:id', (req, res) => {
  const bid = bids.find(b => b.id === parseInt(req.params.id));
  
  if (!bid) {
    return res.status(404).json({
      success: false,
      message: 'Bid not found'
    });
  }

  return res.json({
    success: true,
    data: bid
  });
});

// Create new bid
router.post('/', (req, res) => {
  const { title, description, budget, deadline, vendorId } = req.body;

  if (!title || !description || !budget || !deadline) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, budget, and deadline are required'
    });
  }

  const newBid = {
    id: bids.length + 1,
    title,
    description,
    budget: parseFloat(budget),
    deadline,
    status: 'open',
    vendorId: vendorId || null,
    createdAt: new Date().toISOString()
  };

  bids.push(newBid);

  return res.status(201).json({
    success: true,
    data: newBid
  });
});

// Update bid
router.put('/:id', (req, res) => {
  const bidIndex = bids.findIndex(b => b.id === parseInt(req.params.id));
  
  if (bidIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Bid not found'
    });
  }

  const { title, description, budget, deadline, status, vendorId } = req.body;
  const currentBid = bids[bidIndex];
  
  if (!currentBid) {
    return res.status(404).json({
      success: false,
      message: 'Bid not found'
    });
  }
  
  bids[bidIndex] = {
    ...currentBid,
    title: title || currentBid.title,
    description: description || currentBid.description,
    budget: budget ? parseFloat(budget) : currentBid.budget,
    deadline: deadline || currentBid.deadline,
    status: status || currentBid.status,
    vendorId: vendorId !== undefined ? vendorId : currentBid.vendorId
  };

  return res.json({
    success: true,
    data: bids[bidIndex]
  });
});

// Delete bid
router.delete('/:id', (req, res) => {
  const bidIndex = bids.findIndex(b => b.id === parseInt(req.params.id));
  
  if (bidIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Bid not found'
    });
  }

  bids.splice(bidIndex, 1);

  return res.json({
    success: true,
    message: 'Bid deleted successfully'
  });
});

export default router;