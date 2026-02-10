-- Fix migration for Review constraint
-- This migration safely handles the case where the constraint already exists

-- Drop the constraint if it exists (to avoid conflicts)
DROP INDEX IF EXISTS "Review_orderId_reviewerId_isClientReview_key";

-- Recreate the constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_reviewerId_isClientReview_key" 
ON "Review"("orderId", "reviewerId", "isClientReview") 
WHERE "orderId" IS NOT NULL;
