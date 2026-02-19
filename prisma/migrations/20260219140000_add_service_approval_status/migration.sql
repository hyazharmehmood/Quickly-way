-- CreateEnum
CREATE TYPE "ServiceApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "approvalStatus" "ServiceApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "Service" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Service" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN "reviewedById" TEXT;

-- Existing services: treat as already approved so they stay public
UPDATE "Service" SET "approvalStatus" = 'APPROVED';

-- CreateIndex
CREATE INDEX "Service_approvalStatus_idx" ON "Service"("approvalStatus");
