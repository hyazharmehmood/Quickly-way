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


