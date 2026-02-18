-- Add createdById and assignedAgentId to SupportTicket if missing
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "assignedAgentId" TEXT;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SupportTicket_createdById_idx" ON "SupportTicket"("createdById");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedAgentId_idx" ON "SupportTicket"("assignedAgentId");

-- AddForeignKey createdById
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_createdById_fkey') THEN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey assignedAgentId
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_assignedAgentId_fkey') THEN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
