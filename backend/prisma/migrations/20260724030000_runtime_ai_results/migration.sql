CREATE TABLE IF NOT EXISTS "ai_results" (
  "id" TEXT NOT NULL,
  "analysisType" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "userId" TEXT,
  "inputData" JSONB NOT NULL,
  "result" JSONB NOT NULL,
  "model" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_results_pkey" PRIMARY KEY ("id")
);
