/**
 * One-time script: Add yearsOfExperience column to User table.
 * Run: node scripts/add-years-of-experience.js
 * (from project root; requires .env with DATABASE_URL)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sql = `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;`;
  await prisma.$executeRawUnsafe(sql);
  console.log('Done: User.yearsOfExperience column added (or already exists).');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
