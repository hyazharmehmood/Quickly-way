-- AlterTable: Add offerId and orderId to Message for direct relations (optimized chat fetch)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'offerId') THEN
    ALTER TABLE "Message" ADD COLUMN "offerId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'orderId') THEN
    ALTER TABLE "Message" ADD COLUMN "orderId" TEXT;
  END IF;
END $$;

-- Migrate existing offer messages: attachmentName stores offer ID for type='offer'
UPDATE "Message"
SET "offerId" = "attachmentName"
WHERE "type" = 'offer'
  AND "attachmentName" IS NOT NULL
  AND "offerId" IS NULL
  AND EXISTS (SELECT 1 FROM "Offer" WHERE "Offer"."id" = "Message"."attachmentName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_offerId_idx" ON "Message"("offerId");
CREATE INDEX IF NOT EXISTS "Message_orderId_idx" ON "Message"("orderId");

-- AddForeignKey (after data migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Message_offerId_fkey'
  ) THEN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_offerId_fkey" 
      FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Message_orderId_fkey'
  ) THEN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_orderId_fkey" 
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
