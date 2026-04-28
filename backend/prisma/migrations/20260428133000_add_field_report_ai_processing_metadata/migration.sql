-- Add idempotency and AI audit fields to FieldReport
ALTER TABLE "FieldReport"
ADD COLUMN "requestFingerprint" TEXT,
ADD COLUMN "aiRawOutput" JSONB,
ADD COLUMN "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aiProcessedAt" TIMESTAMP(3),
ADD COLUMN "pipelineStage" TEXT NOT NULL DEFAULT 'RECEIVED';

CREATE UNIQUE INDEX "FieldReport_requestFingerprint_key"
ON "FieldReport"("requestFingerprint");