-- ============================================================
-- Service Approval Status - Local ya Production dono par run karne ke liye
-- ============================================================
-- Safe: isko ek se zyada bar run kar sakte ho – already exist kuch bhi ho to error nahi aayega.
--
-- Kaise run karein:
-- • Neon Production: Console > SQL Editor > is file ka saara SQL paste karke Run
-- • psql: psql "YOUR_DATABASE_URL" -f docs/apply-service-approval-manually.sql
-- • Prisma: npx prisma db execute --file prisma/apply-service-approval.sql --schema prisma/schema.prisma
-- ============================================================

-- 1. Enum (pehle se hai to skip)
DO $$ BEGIN
  CREATE TYPE "ServiceApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Columns (pehle se hain to skip)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "approvalStatus" "ServiceApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

-- 3. Purani services = approved (public dikhen)
UPDATE "Service" SET "approvalStatus" = 'APPROVED';

-- 4. Index (pehle se hai to skip)
CREATE INDEX IF NOT EXISTS "Service_approvalStatus_idx" ON "Service"("approvalStatus");
