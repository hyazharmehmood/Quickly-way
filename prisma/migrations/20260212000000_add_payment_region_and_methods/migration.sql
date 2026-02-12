-- AlterTable: Service - add paymentRegion and paymentMethods
ALTER TABLE "Service" ADD COLUMN "paymentRegion" TEXT;
ALTER TABLE "Service" ADD COLUMN "paymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Order - add paymentMethodUsed
ALTER TABLE "Order" ADD COLUMN "paymentMethodUsed" TEXT;
