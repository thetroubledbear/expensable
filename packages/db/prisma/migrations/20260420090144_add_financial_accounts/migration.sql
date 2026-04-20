-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "financialAccountId" TEXT,
ADD COLUMN     "transferPairId" TEXT;

-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN     "financialAccountId" TEXT;

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'checking',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_householdId_name_key" ON "FinancialAccount"("householdId", "name");

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
