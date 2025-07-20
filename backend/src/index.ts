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
import { bidRoutes } from './routes/bids'; // Update import
import complianceRoutes from './routes/compliance';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import productRoutes from './routes/products';

// ... rest of the code remains unchanged ...
