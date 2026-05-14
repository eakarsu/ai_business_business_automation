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
import { sanitizeInput } from './middleware/validate';
import { auditLogMiddleware } from './middleware/auditLog';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import { bidRoutes } from './routes/bids';
import complianceRoutes from './routes/compliance';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import aiBacklogRoutes from './routes/aiBacklog';
import aiBacklog2Routes from './routes/aiBacklog2';
import productRoutes from './routes/products';
import contractRoutes from './routes/contracts';
import rfpRoutes from './routes/rfps';
import spendRoutes from './routes/spend';
import savingsRoutes from './routes/savings';
import counterOfferRoutes from './routes/counterOffers';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

const clientOrigin = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);

// General rate limiter - 100 req per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);
app.use(auditLogMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/bids', authenticateToken, bidRoutes);
app.use('/api/compliance', authenticateToken, complianceRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-backlog', aiBacklogRoutes);
app.use('/api/ai-backlog2', aiBacklog2Routes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/contracts', authenticateToken, contractRoutes);
app.use('/api/rfps', authenticateToken, rfpRoutes);
app.use('/api/spend', authenticateToken, spendRoutes);
app.use('/api/savings', authenticateToken, savingsRoutes);
app.use('/api/counter-offers', authenticateToken, counterOfferRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
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

// BATCH_00_AUDIT_MOUNTS
import supplyChainRiskRoutes from './routes/supplyChainRisk';
import multiLanguageRfpRoutes from './routes/multiLanguageRfp';
import negotiationWorkspaceRoutes from './routes/negotiationWorkspace';
import spendClassifierRoutes from './routes/spendClassifier';
import marketplaceBridgeRoutes from './routes/marketplaceBridge';
app.use('/api/supply-chain-risk', supplyChainRiskRoutes);
app.use('/api/multi-language-rfp', multiLanguageRfpRoutes);
app.use('/api/negotiation-workspace', negotiationWorkspaceRoutes);
app.use('/api/spend-classifier', spendClassifierRoutes);
app.use('/api/marketplace-bridge', marketplaceBridgeRoutes);
// === Batch 00 Gaps & Frontend Mounts ===
import gapAiContractLanguageSimplificationLegalRouter from './routes/gap_ai_contract_language_simplification_legal';
import gapSupplierSustainabilityEsgScoringRouter from './routes/gap_supplier_sustainability_esg_scoring';
import gapStreamingSpendAnomalyDetectionOnlyRouter from './routes/gap_streaming_spend_anomaly_detection_only';
import gapAiVendorConsolidationRecommendationRouter from './routes/gap_ai_vendor_consolidation_recommendation';
import gapAiDeliveryTimePredictionPerRouter from './routes/gap_ai_delivery_time_prediction_per';
import gap3WayInvoicePoReceiptRouter from './routes/gap_3_way_invoice_po_receipt';
import gapSupplierOnboardingChecklistAutomationRouter from './routes/gap_supplier_onboarding_checklist_automation';
import gapCatalogEnrichmentWebScrapingImagesRouter from './routes/gap_catalog_enrichment_web_scraping_images';
import gapOutboundWebhookDeliveryNotificationsAreRouter from './routes/gap_outbound_webhook_delivery_notifications_are';
import gapESignatureWorkflowContractsRouter from './routes/gap_e_signature_workflow_contracts';
app.use('/api/gap-ai-contract-language-simplification-legal', gapAiContractLanguageSimplificationLegalRouter);
app.use('/api/gap-supplier-sustainability-esg-scoring', gapSupplierSustainabilityEsgScoringRouter);
app.use('/api/gap-streaming-spend-anomaly-detection-only', gapStreamingSpendAnomalyDetectionOnlyRouter);
app.use('/api/gap-ai-vendor-consolidation-recommendation', gapAiVendorConsolidationRecommendationRouter);
app.use('/api/gap-ai-delivery-time-prediction-per', gapAiDeliveryTimePredictionPerRouter);
app.use('/api/gap-3-way-invoice-po-receipt', gap3WayInvoicePoReceiptRouter);
app.use('/api/gap-supplier-onboarding-checklist-automation', gapSupplierOnboardingChecklistAutomationRouter);
app.use('/api/gap-catalog-enrichment-web-scraping-images', gapCatalogEnrichmentWebScrapingImagesRouter);
app.use('/api/gap-outbound-webhook-delivery-notifications-are', gapOutboundWebhookDeliveryNotificationsAreRouter);
app.use('/api/gap-e-signature-workflow-contracts', gapESignatureWorkflowContractsRouter);
