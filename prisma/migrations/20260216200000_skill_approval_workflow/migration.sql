-- CreateEnum
CREATE TYPE "SkillApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "approvalStatus" "SkillApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Skill_approvalStatus_idx" ON "Skill"("approvalStatus");
CREATE INDEX IF NOT EXISTS "Skill_createdByUserId_idx" ON "Skill"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;