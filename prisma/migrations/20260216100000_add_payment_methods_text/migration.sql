-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "paymentMethodsText" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "paymentMethodsTextAr" TEXT;
