-- CreateEnum (idempotent: skip if type already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KeywordApprovalStatus') THEN
    CREATE TYPE "KeywordApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN IF NOT EXISTS "approvalStatus" "KeywordApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Keyword" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Keyword_approvalStatus_idx" ON "Keyword"("approvalStatus");
CREATE INDEX IF NOT EXISTS "Keyword_createdByUserId_idx" ON "Keyword"("createdByUserId");

-- AddForeignKey (idempotent: only if constraint does not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Keyword_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
