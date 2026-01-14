-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "coverColor" TEXT,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "coverText" TEXT,
ADD COLUMN     "coverType" TEXT NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "workingHours" TEXT;
