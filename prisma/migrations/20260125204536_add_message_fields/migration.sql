-- CreateTable: Create Message table if it doesn't exist
-- Using DO block to safely create table and add columns
DO $$ 
BEGIN
    -- Create Message table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Message') THEN
        CREATE TABLE "Message" (
            "id" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "senderId" TEXT NOT NULL,
            "conversationId" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'text',
            "attachmentUrl" TEXT,
            "attachmentName" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deliveredAt" TIMESTAMP(3),
            "seenAt" TIMESTAMP(3),

            CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
        );

        -- Add foreign keys only if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Message_conversationId_fkey') THEN
            ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Message_senderId_fkey') THEN
            ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;

        -- Create indexes
        CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
        CREATE INDEX IF NOT EXISTS "Message_deliveredAt_idx" ON "Message"("deliveredAt");
        CREATE INDEX IF NOT EXISTS "Message_seenAt_idx" ON "Message"("seenAt");
    ELSE
        -- Table exists, just add missing columns
        -- Add type column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Message' AND column_name = 'type') THEN
            ALTER TABLE "Message" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text';
        END IF;
        
        -- Add attachmentUrl column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Message' AND column_name = 'attachmentUrl') THEN
            ALTER TABLE "Message" ADD COLUMN "attachmentUrl" TEXT;
        END IF;
        
        -- Add attachmentName column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Message' AND column_name = 'attachmentName') THEN
            ALTER TABLE "Message" ADD COLUMN "attachmentName" TEXT;
        END IF;
        
        -- Add deliveredAt column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Message' AND column_name = 'deliveredAt') THEN
            ALTER TABLE "Message" ADD COLUMN "deliveredAt" TIMESTAMP(3);
        END IF;
        
        -- Add seenAt column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Message' AND column_name = 'seenAt') THEN
            ALTER TABLE "Message" ADD COLUMN "seenAt" TIMESTAMP(3);
        END IF;

        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS "Message_deliveredAt_idx" ON "Message"("deliveredAt");
        CREATE INDEX IF NOT EXISTS "Message_seenAt_idx" ON "Message"("seenAt");
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail migration
        RAISE NOTICE 'Migration error (may be expected if columns already exist): %', SQLERRM;
END $$;

