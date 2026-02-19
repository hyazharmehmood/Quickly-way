-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "mobileImageUrl" TEXT,
    "desktopImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_isActive_idx" ON "Banner"("isActive");

-- CreateIndex
CREATE INDEX "Banner_sortOrder_idx" ON "Banner"("sortOrder");
