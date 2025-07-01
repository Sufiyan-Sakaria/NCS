-- AlterTable
ALTER TABLE "ProductLedgerEntry" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
