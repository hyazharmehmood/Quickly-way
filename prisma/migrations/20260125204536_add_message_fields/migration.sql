-- AlterTable: Add missing fields to Message table
-- Using DO block to safely add columns only if they don't exist
DO $$ 
BEGIN
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'type') THEN
        ALTER TABLE "Message" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text';
    END IF;
    
    -- Add attachmentUrl column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'attachmentUrl') THEN
        ALTER TABLE "Message" ADD COLUMN "attachmentUrl" TEXT;
    END IF;
    
    -- Add attachmentName column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'attachmentName') THEN
        ALTER TABLE "Message" ADD COLUMN "attachmentName" TEXT;
    END IF;
    
    -- Add deliveredAt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'deliveredAt') THEN
        ALTER TABLE "Message" ADD COLUMN "deliveredAt" TIMESTAMP(3);
    END IF;
    
    -- Add seenAt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'seenAt') THEN
        ALTER TABLE "Message" ADD COLUMN "seenAt" TIMESTAMP(3);
    END IF;
END $$;

-- CreateIndex: Add indexes for the new fields (only if they don't exist)
CREATE INDEX IF NOT EXISTS "Message_deliveredAt_idx" ON "Message"("deliveredAt");
CREATE INDEX IF NOT EXISTS "Message_seenAt_idx" ON "Message"("seenAt");

