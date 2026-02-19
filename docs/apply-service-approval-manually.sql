-- Run this in Neon SQL Editor (or psql) if prisma migrate deploy fails (e.g. TLS).
-- Adds Service approval columns. Run once.

-- 1. Create enum (ignore error if already exists)
CREATE TYPE "ServiceApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- 2. Add columns
ALTER TABLE "Service" ADD COLUMN "approvalStatus" "ServiceApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "Service" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Service" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN "reviewedById" TEXT;

-- 3. Existing services = approved
UPDATE "Service" SET "approvalStatus" = 'APPROVED';

-- 4. Index
CREATE INDEX "Service_approvalStatus_idx" ON "Service"("approvalStatus");
