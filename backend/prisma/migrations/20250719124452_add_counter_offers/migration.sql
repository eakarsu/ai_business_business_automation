-- CreateEnum
CREATE TYPE "CounterOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'UNDER_REVIEW');

-- AlterEnum
ALTER TYPE "BidStatus" ADD VALUE 'COUNTER_OFFERED';

-- CreateTable
CREATE TABLE "counter_offers" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "proposedAmount" DOUBLE PRECISION,
    "proposedTimeline" INTEGER,
    "modifications" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "technicalChanges" TEXT,
    "alternativeApproach" TEXT,
    "status" "CounterOfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "aiRecommendation" TEXT,
    "riskAssessment" JSONB,

    CONSTRAINT "counter_offers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "counter_offers" ADD CONSTRAINT "counter_offers_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;
