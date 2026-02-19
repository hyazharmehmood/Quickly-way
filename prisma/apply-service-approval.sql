-- ============================================================
-- Service Approval Status - Existing DB par apply karne ke liye
-- ============================================================
-- Run karne ke tareeke (project folder se):
--
-- 1) Prisma se (agar DB connect ho):
--    npx prisma db execute --file prisma/apply-service-approval.sql --schema prisma/schema.prisma
--
-- 2) Neon use ho to: Neon Console > SQL Editor > is file ka saara SQL copy-paste karke Run
--
-- 3) Local psql: psql "postgresql://user:pass@localhost:5432/dbname" -f prisma/apply-service-approval.sql
-- ============================================================

-- Enum (agar pehle se hai to skip)
DO $$ BEGIN
  CREATE TYPE "ServiceApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Columns (agar pehle se hain to skip)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "approvalStatus" "ServiceApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

-- Purani services ko approved mark karo (public dikhen)
UPDATE "Service" SET "approvalStatus" = 'APPROVED';

-- Index
CREATE INDEX IF NOT EXISTS "Service_approvalStatus_idx" ON "Service"("approvalStatus");
