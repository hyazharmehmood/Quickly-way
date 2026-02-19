-- Copy this entire file and run it ONCE in your database (Neon SQL Editor, pgAdmin, psql, etc.)
-- Fixes: "The column Service.approvalStatus does not exist in the current database"

-- 1. Create enum (safe: no error if exists)
DO $$ BEGIN
  CREATE TYPE "ServiceApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add columns (run one by one; if "column already exists", skip that line)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "approvalStatus" "ServiceApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

-- 3. Existing rows = approved
UPDATE "Service" SET "approvalStatus" = 'APPROVED';

-- 4. Index (safe: no error if exists)
CREATE INDEX IF NOT EXISTS "Service_approvalStatus_idx" ON "Service"("approvalStatus");
