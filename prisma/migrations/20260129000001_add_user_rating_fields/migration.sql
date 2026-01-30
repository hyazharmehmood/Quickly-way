-- Add rating and reviewCount columns to User table
-- These fields will be automatically updated when reviews are created

-- Add rating column (nullable, defaults to 0)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION DEFAULT 0;

-- Add reviewCount column (defaults to 0)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- Update existing users to have default values
UPDATE "User" 
SET "rating" = 0 
WHERE "rating" IS NULL;

UPDATE "User" 
SET "reviewCount" = 0 
WHERE "reviewCount" IS NULL;

-- Make rating NOT NULL after setting defaults
ALTER TABLE "User" 
ALTER COLUMN "rating" SET NOT NULL,
ALTER COLUMN "rating" SET DEFAULT 0;


