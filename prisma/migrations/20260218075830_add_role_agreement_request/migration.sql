/*
  Warnings:

  - A unique constraint covering the columns `[orderId,reviewerId,isClientReview]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RequestedRole" AS ENUM ('CLIENT', 'FREELANCER');

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "paymentMethods" DROP DEFAULT;

-- CreateTable
CREATE TABLE "RoleAgreementRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRole" "RequestedRole" NOT NULL,
    "status" "SellerStatus" NOT NULL DEFAULT 'PENDING',
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleAgreementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleAgreementRequest_status_idx" ON "RoleAgreementRequest"("status");

-- CreateIndex
CREATE INDEX "RoleAgreementRequest_requestedRole_idx" ON "RoleAgreementRequest"("requestedRole");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAgreementRequest_userId_requestedRole_key" ON "RoleAgreementRequest"("userId", "requestedRole");

-- CreateIndex (IF NOT EXISTS: index may already exist from 20260129000003_fix_review_constraint)
CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_reviewerId_isClientReview_key" ON "Review"("orderId", "reviewerId", "isClientReview");

-- AddForeignKey
ALTER TABLE "RoleAgreementRequest" ADD CONSTRAINT "RoleAgreementRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAgreementRequest" ADD CONSTRAINT "RoleAgreementRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
