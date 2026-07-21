import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { sanitizeInput } from './middleware/validate';
import { auditLogMiddleware } from './middleware/auditLog';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import { bidRoutes } from './routes/bids';
import productRoutes from './routes/products';

dotenv.config();

export const app = express();
export const httpServer = createServer(app);
const requestTotals = new Map<string, number>();

app.use(helmet());
const clientOrigin = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);
app.use((req, res, next) => {
  const requestId = String(req.headers['x-request-id'] || crypto.randomUUID());
  res.setHeader('X-Request-Id', requestId);
  const started = Date.now();
  res.on('finish', () => {
    const key = `${req.method}:${res.statusCode}`;
    requestTotals.set(key, (requestTotals.get(key) || 0) + 1);
    console.log(JSON.stringify({ level: 'info', event: 'http_request', requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started }));
  });
  next();
});
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(auditLogMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/bids', authenticateToken, bidRoutes);

const experimentalEnabled = process.env.ENABLE_EXPERIMENTAL_ROUTES === 'true' && process.env.NODE_ENV !== 'production';
if (experimentalEnabled) {
  // Lazy loading prevents prototype providers and their credentials from being
  // initialized in the authoritative runtime.
  const protectedRoutes: Array<[string, express.Router]> = [
    ['/api/compliance', require('./routes/compliance').default], ['/api/dashboard', require('./routes/dashboard').default], ['/api/ai', require('./routes/ai').default],
    ['/api/ai-backlog', require('./routes/aiBacklog').default], ['/api/ai-backlog2', require('./routes/aiBacklog2').default], ['/api/contracts', require('./routes/contracts').default],
    ['/api/rfps', require('./routes/rfps').default], ['/api/spend', require('./routes/spend').default], ['/api/savings', require('./routes/savings').default],
    ['/api/counter-offers', require('./routes/counterOffers').default], ['/api/analytics', require('./routes/analytics').default], ['/api/notifications', require('./routes/notifications').default],
    ['/api/supplier-dependency-risk', require('./routes/supplierDependencyRisk').default], ['/api/supply-chain-risk', require('./routes/supplyChainRisk').default],
    ['/api/multi-language-rfp', require('./routes/multiLanguageRfp').default], ['/api/negotiation-workspace', require('./routes/negotiationWorkspace').default],
    ['/api/spend-classifier', require('./routes/spendClassifier').default], ['/api/marketplace-bridge', require('./routes/marketplaceBridge').default],
    ['/api/gap-ai-contract-language-simplification-legal', require('./routes/gap_ai_contract_language_simplification_legal').default],
    ['/api/gap-supplier-sustainability-esg-scoring', require('./routes/gap_supplier_sustainability_esg_scoring').default],
    ['/api/gap-streaming-spend-anomaly-detection-only', require('./routes/gap_streaming_spend_anomaly_detection_only').default],
    ['/api/gap-ai-vendor-consolidation-recommendation', require('./routes/gap_ai_vendor_consolidation_recommendation').default],
    ['/api/gap-ai-delivery-time-prediction-per', require('./routes/gap_ai_delivery_time_prediction_per').default],
    ['/api/gap-3-way-invoice-po-receipt', require('./routes/gap_3_way_invoice_po_receipt').default],
    ['/api/gap-supplier-onboarding-checklist-automation', require('./routes/gap_supplier_onboarding_checklist_automation').default],
    ['/api/gap-catalog-enrichment-web-scraping-images', require('./routes/gap_catalog_enrichment_web_scraping_images').default],
    ['/api/gap-outbound-webhook-delivery-notifications-are', require('./routes/gap_outbound_webhook_delivery_notifications_are').default],
    ['/api/gap-e-signature-workflow-contracts', require('./routes/gap_e_signature_workflow_contracts').default],
  ];
  protectedRoutes.forEach(([path, router]) => app.use(path, authenticateToken, router));
}

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'healthy' }));
app.get('/api/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: 'ready', database: 'ok' });
  } catch (error) {
    res.status(503).json({ success: false, status: 'not_ready', database: 'error' });
  }
});
app.get('/api/metrics', (_req, res) => {
  res.type('text/plain').send([...requestTotals.entries()].map(([key, value]) => {
    const [method, status] = key.split(':');
    return `http_requests_total{method="${method}",status="${status}"} ${value}`;
  }).join('\n') + '\n');
});
app.use(errorHandler);

export function startServer() {
  const missing = ['DATABASE_URL'].filter(key => !process.env[key]);
  if (missing.length || (process.env.AUTH_MODE !== 'oidc' && (process.env.JWT_SECRET?.length ?? 0) < 32)) {
    throw new Error(`Unsafe configuration: missing ${missing.join(', ') || 'a JWT_SECRET of at least 32 characters for local authentication'}`);
  }
  if (process.env.NODE_ENV === 'production' && (process.env.AUTH_MODE !== 'oidc' || !process.env.OIDC_ISSUER?.startsWith('https://') || !process.env.OIDC_AUDIENCE || !process.env.OIDC_JWKS_URL?.startsWith('https://'))) throw new Error('Production requires AUTH_MODE=oidc and HTTPS OIDC configuration');
  const port = Number(process.env.PORT || 3001);
  return httpServer.listen(port, () => console.log(JSON.stringify({ level: 'info', event: 'server_started', port })));
}

if (require.main === module) {
  startServer();
  process.on('uncaughtException', err => { console.error(err); process.exit(1); });
  process.on('unhandledRejection', reason => { console.error(reason); process.exit(1); });
}
