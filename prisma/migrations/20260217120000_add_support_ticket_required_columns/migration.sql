-- Add required columns to SupportTicket with defaults for existing 5 rows
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "fullName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "ticketNo" TEXT NOT NULL DEFAULT '';

-- Backfill unique ticketNo for existing rows
UPDATE "SupportTicket" SET "ticketNo" = 'legacy-' || "id" WHERE "ticketNo" = '';

-- Add unique constraint on ticketNo
CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNo_key" ON "SupportTicket"("ticketNo");
