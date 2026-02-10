-- Create Order and Offer tables first (Review depends on Order)
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING_ACCEPTANCE', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED', 'DISPUTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryTime" INTEGER NOT NULL,
    "revisionsIncluded" INTEGER NOT NULL DEFAULT 0,
    "scopeOfWork" TEXT NOT NULL,
    "cancellationPolicy" TEXT,
    "serviceTitle" TEXT NOT NULL,
    "serviceDescription" TEXT,
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Offer_orderId_key" ON "Offer"("orderId");
CREATE INDEX IF NOT EXISTS "Offer_clientId_idx" ON "Offer"("clientId");
CREATE INDEX IF NOT EXISTS "Offer_freelancerId_idx" ON "Offer"("freelancerId");
CREATE INDEX IF NOT EXISTS "Offer_serviceId_idx" ON "Offer"("serviceId");
CREATE INDEX IF NOT EXISTS "Offer_status_idx" ON "Offer"("status");
CREATE INDEX IF NOT EXISTS "Offer_conversationId_idx" ON "Offer"("conversationId");
CREATE INDEX IF NOT EXISTS "Offer_orderId_idx" ON "Offer"("orderId");

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "offerId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryTime" INTEGER NOT NULL,
    "revisionsIncluded" INTEGER NOT NULL DEFAULT 0,
    "revisionsUsed" INTEGER NOT NULL DEFAULT 0,
    "deliveryDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "clientIpAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_clientId_idx" ON "Order"("clientId");
CREATE INDEX IF NOT EXISTS "Order_freelancerId_idx" ON "Order"("freelancerId");
CREATE INDEX IF NOT EXISTS "Order_serviceId_idx" ON "Order"("serviceId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_conversationId_idx" ON "Order"("conversationId");
CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx" ON "Order"("orderNumber");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_serviceId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_clientId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_freelancerId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_conversationId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_serviceId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_clientId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_freelancerId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_conversationId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_orderId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_offerId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Create Review table
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "serviceId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isOrderReview" BOOLEAN NOT NULL DEFAULT true,
    "isClientReview" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for order reviews
CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_reviewerId_isClientReview_key" 
ON "Review"("orderId", "reviewerId", "isClientReview") 
WHERE "orderId" IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Review_orderId_idx" ON "Review"("orderId");
CREATE INDEX IF NOT EXISTS "Review_serviceId_idx" ON "Review"("serviceId");
CREATE INDEX IF NOT EXISTS "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX IF NOT EXISTS "Review_revieweeId_idx" ON "Review"("revieweeId");
CREATE INDEX IF NOT EXISTS "Review_isOrderReview_idx" ON "Review"("isOrderReview");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");

-- Add foreign keys
DO $$ 
BEGIN
    -- Review to Order
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Review_orderId_fkey'
    ) THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Review to Service
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Review_serviceId_fkey'
    ) THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" 
        FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Review to User (reviewer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Review_reviewerId_fkey'
    ) THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" 
        FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Review to User (reviewee)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Review_revieweeId_fkey'
    ) THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" 
        FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;


