-- CreateEnum
CREATE TYPE "KeywordApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN IF NOT EXISTS "approvalStatus" "KeywordApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Keyword" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Keyword_approvalStatus_idx" ON "Keyword"("approvalStatus");
CREATE INDEX IF NOT EXISTS "Keyword_createdByUserId_idx" ON "Keyword"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
