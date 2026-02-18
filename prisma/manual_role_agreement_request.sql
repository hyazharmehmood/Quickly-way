-- Run this in your database (e.g. Neon SQL Editor) if migrate dev fails.
-- Creates only the RoleAgreementRequest table and enum (no Review/Service changes).

-- CreateEnum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE "RequestedRole" AS ENUM ('CLIENT', 'FREELANCER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RoleAgreementRequest" (
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

-- Indexes (ignore if exist)
CREATE INDEX IF NOT EXISTS "RoleAgreementRequest_status_idx" ON "RoleAgreementRequest"("status");
CREATE INDEX IF NOT EXISTS "RoleAgreementRequest_requestedRole_idx" ON "RoleAgreementRequest"("requestedRole");
CREATE UNIQUE INDEX IF NOT EXISTS "RoleAgreementRequest_userId_requestedRole_key" ON "RoleAgreementRequest"("userId", "requestedRole");

-- Foreign keys (skip if already added)
DO $$ BEGIN
  ALTER TABLE "RoleAgreementRequest" ADD CONSTRAINT "RoleAgreementRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RoleAgreementRequest" ADD CONSTRAINT "RoleAgreementRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
