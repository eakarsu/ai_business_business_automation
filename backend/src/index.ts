import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import { bidRoutes } from './routes/bids';
import complianceRoutes from './routes/compliance';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import productRoutes from './routes/products';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.BACKEND_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
