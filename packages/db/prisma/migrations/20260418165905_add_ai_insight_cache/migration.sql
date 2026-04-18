-- CreateTable
CREATE TABLE "AIInsightCache" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "insights" TEXT NOT NULL,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsightCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIInsightCache_householdId_month_key" ON "AIInsightCache"("householdId", "month");

-- AddForeignKey
ALTER TABLE "AIInsightCache" ADD CONSTRAINT "AIInsightCache_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
