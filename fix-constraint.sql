-- Fix script for Review constraint issue
-- Run this in your PostgreSQL database if the constraint already exists

-- Check if constraint exists
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Review_orderId_reviewerId_isClientReview_key'
    ) THEN
        RAISE NOTICE 'Dropping existing constraint: Review_orderId_reviewerId_isClientReview_key';
        DROP INDEX IF EXISTS "Review_orderId_reviewerId_isClientReview_key";
    END IF;
    
    -- Recreate the constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Review_orderId_reviewerId_isClientReview_key'
    ) THEN
        RAISE NOTICE 'Creating constraint: Review_orderId_reviewerId_isClientReview_key';
        CREATE UNIQUE INDEX "Review_orderId_reviewerId_isClientReview_key" 
        ON "Review"("orderId", "reviewerId", "isClientReview") 
        WHERE "orderId" IS NOT NULL;
    END IF;
END $$;

-- Verify the constraint was created
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'Review'::regclass 
AND conname = 'Review_orderId_reviewerId_isClientReview_key';

