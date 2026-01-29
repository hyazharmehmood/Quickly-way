-- CreateTable
CREATE TABLE IF NOT EXISTS "Keyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "volume" TEXT,
    "difficulty" TEXT,
    "rank" INTEGER,
    "trend" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Keyword_keyword_key" ON "Keyword"("keyword");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Keyword_keyword_idx" ON "Keyword"("keyword");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Keyword_isActive_idx" ON "Keyword"("isActive");



