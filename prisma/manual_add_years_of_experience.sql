-- Migration: Add yearsOfExperience field to User table
-- Run this SQL in your database (e.g. Neon SQL Editor) or via: npx prisma migrate dev

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;

-- Optional: Set default for existing users (if needed)
-- UPDATE "User" SET "yearsOfExperience" = 0 WHERE "yearsOfExperience" IS NULL;
