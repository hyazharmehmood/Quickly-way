/**
 * Migration script to populate Contract fields from Order data
 * Uses raw SQL since Order model was removed from schema
 * 
 * Steps:
 * 1. Run: npx prisma db push (with optional fields)
 * 2. Run: node prisma/migrate-contracts.js
 * 3. Update schema to make fields required
 * 4. Run: npx prisma db push again
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateContractNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CTR-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

async function migrateContracts() {
  try {
    console.log('Starting contract migration...');

    // Get all contracts that need migration using raw SQL
    const contractsNeedingMigration = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."contractNumber",
        c."serviceId",
        c."clientId",
        c."freelancerId",
        c."conversationId",
        o."orderNumber",
        o."serviceId" as order_service_id,
        o."clientId" as order_client_id,
        o."freelancerId" as order_freelancer_id,
        o."conversationId" as order_conversation_id
      FROM "Contract" c
      LEFT JOIN "Order" o ON c."orderId" = o.id
      WHERE c."contractNumber" IS NULL 
         OR c."serviceId" IS NULL 
         OR c."clientId" IS NULL 
         OR c."freelancerId" IS NULL
    `;

    console.log(`Found ${contractsNeedingMigration.length} contracts to migrate`);

    for (const contract of contractsNeedingMigration) {
      const updates = {};

      // Generate contract number if missing
      if (!contract.contractNumber) {
        updates.contractNumber = contract.orderNumber || generateContractNumber();
      }

      // Populate from order
      if (!contract.serviceId && contract.order_service_id) {
        updates.serviceId = contract.order_service_id;
      }

      if (!contract.clientId && contract.order_client_id) {
        updates.clientId = contract.order_client_id;
      }

      if (!contract.freelancerId && contract.order_freelancer_id) {
        updates.freelancerId = contract.order_freelancer_id;
      }

      if (!contract.conversationId && contract.order_conversation_id) {
        updates.conversationId = contract.order_conversation_id;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: updates,
        });
        console.log(`✓ Migrated contract ${contract.id}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update schema.prisma to make contractNumber, serviceId, clientId, freelancerId required (remove ?)');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma generate');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateContracts();

