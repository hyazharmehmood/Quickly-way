/*
  Warnings:

  - You are about to drop the column `responseTime` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the `WorkingHour` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING_ACCEPTANCE', 'ACTIVE', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('FILE', 'MESSAGE', 'LINK');

-- CreateEnum
CREATE TYPE "ContractEventType" AS ENUM ('CONTRACT_CREATED', 'CONTRACT_ACCEPTED', 'CONTRACT_REJECTED', 'CONTRACT_ACTIVE', 'DELIVERY_SUBMITTED', 'DELIVERY_ACCEPTED', 'REVISION_REQUESTED', 'CONTRACT_COMPLETED', 'CONTRACT_CANCELLED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACTIVE', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderEventType" AS ENUM ('ORDER_CREATED', 'ORDER_ACTIVATED', 'DELIVERY_SUBMITTED', 'DELIVERY_ACCEPTED', 'REVISION_REQUESTED', 'ORDER_COMPLETED', 'ORDER_CANCELLED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'STATUS_CHANGED');

-- DropForeignKey
ALTER TABLE "WorkingHour" DROP CONSTRAINT "WorkingHour_serviceId_fkey";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "responseTime",
ADD COLUMN     "searchTags" TEXT[];

-- DropTable
DROP TABLE "WorkingHour";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageText" TEXT,
    "lastSenderId" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT,
    "serviceId" TEXT,
    "clientId" TEXT,
    "freelancerId" TEXT,
    "conversationId" TEXT,
    "serviceTitle" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "scopeOfWork" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryTime" INTEGER NOT NULL,
    "revisionsIncluded" INTEGER NOT NULL DEFAULT 0,
    "revisionsUsed" INTEGER NOT NULL DEFAULT 0,
    "cancellationPolicy" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "clientAcceptedAt" TIMESTAMP(3),
    "freelancerAcceptedAt" TIMESTAMP(3),
    "clientIpAddress" TEXT,
    "freelancerIpAddress" TEXT,
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDeliverable" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "DeliverableType" NOT NULL DEFAULT 'FILE',
    "fileUrl" TEXT,
    "message" TEXT,
    "isRevision" BOOLEAN NOT NULL DEFAULT false,
    "revisionNumber" INTEGER,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "ContractDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractEvent" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "ContractEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "serviceId" TEXT,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "serviceTitle" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "scopeOfWork" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryTime" INTEGER NOT NULL,
    "revisionsIncluded" INTEGER NOT NULL DEFAULT 0,
    "revisionsUsed" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDeliverable" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "DeliverableType" NOT NULL DEFAULT 'FILE',
    "fileUrl" TEXT,
    "message" TEXT,
    "isRevision" BOOLEAN NOT NULL DEFAULT false,
    "revisionNumber" INTEGER,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "OrderDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "OrderEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "adminResolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "adminResolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_deliveredAt_idx" ON "Message"("deliveredAt");

-- CreateIndex
CREATE INDEX "Message_seenAt_idx" ON "Message"("seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_clientId_idx" ON "Contract"("clientId");

-- CreateIndex
CREATE INDEX "Contract_freelancerId_idx" ON "Contract"("freelancerId");

-- CreateIndex
CREATE INDEX "Contract_serviceId_idx" ON "Contract"("serviceId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_conversationId_idx" ON "Contract"("conversationId");

-- CreateIndex
CREATE INDEX "Contract_contractNumber_idx" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "ContractDeliverable_contractId_idx" ON "ContractDeliverable"("contractId");

-- CreateIndex
CREATE INDEX "ContractDeliverable_deliveredAt_idx" ON "ContractDeliverable"("deliveredAt");

-- CreateIndex
CREATE INDEX "ContractEvent_contractId_idx" ON "ContractEvent"("contractId");

-- CreateIndex
CREATE INDEX "ContractEvent_userId_idx" ON "ContractEvent"("userId");

-- CreateIndex
CREATE INDEX "ContractEvent_eventType_idx" ON "ContractEvent"("eventType");

-- CreateIndex
CREATE INDEX "ContractEvent_createdAt_idx" ON "ContractEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_contractId_key" ON "Order"("contractId");

-- CreateIndex
CREATE INDEX "Order_contractId_idx" ON "Order"("contractId");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");

-- CreateIndex
CREATE INDEX "Order_freelancerId_idx" ON "Order"("freelancerId");

-- CreateIndex
CREATE INDEX "Order_serviceId_idx" ON "Order"("serviceId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_conversationId_idx" ON "Order"("conversationId");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "OrderDeliverable_orderId_idx" ON "OrderDeliverable"("orderId");

-- CreateIndex
CREATE INDEX "OrderDeliverable_deliveredAt_idx" ON "OrderDeliverable"("deliveredAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvent_userId_idx" ON "OrderEvent"("userId");

-- CreateIndex
CREATE INDEX "OrderEvent_eventType_idx" ON "OrderEvent"("eventType");

-- CreateIndex
CREATE INDEX "OrderEvent_createdAt_idx" ON "OrderEvent"("createdAt");

-- CreateIndex
CREATE INDEX "OrderDispute_orderId_idx" ON "OrderDispute"("orderId");

-- CreateIndex
CREATE INDEX "OrderDispute_status_idx" ON "OrderDispute"("status");

-- CreateIndex
CREATE INDEX "OrderDispute_clientId_idx" ON "OrderDispute"("clientId");

-- CreateIndex
CREATE INDEX "OrderDispute_freelancerId_idx" ON "OrderDispute"("freelancerId");

-- CreateIndex
CREATE INDEX "Dispute_contractId_idx" ON "Dispute"("contractId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_clientId_idx" ON "Dispute"("clientId");

-- CreateIndex
CREATE INDEX "Dispute_freelancerId_idx" ON "Dispute"("freelancerId");

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDeliverable" ADD CONSTRAINT "ContractDeliverable_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractEvent" ADD CONSTRAINT "ContractEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractEvent" ADD CONSTRAINT "ContractEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDeliverable" ADD CONSTRAINT "OrderDeliverable_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
