-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "volume" TEXT,
    "difficulty" TEXT,
    "rank" INTEGER,
    "trend" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_keyword_key" ON "Keyword"("keyword");
CREATE INDEX "Keyword_keyword_idx" ON "Keyword"("keyword");
CREATE INDEX "Keyword_isActive_idx" ON "Keyword"("isActive");
