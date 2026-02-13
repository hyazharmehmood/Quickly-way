-- CreateTable
CREATE TABLE "SearchKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchKeyword_keyword_key" ON "SearchKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SearchKeyword_keyword_idx" ON "SearchKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SearchKeyword_count_idx" ON "SearchKeyword"("count");
