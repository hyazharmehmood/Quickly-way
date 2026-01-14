-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availability" JSONB,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showMobile" BOOLEAN NOT NULL DEFAULT false;
