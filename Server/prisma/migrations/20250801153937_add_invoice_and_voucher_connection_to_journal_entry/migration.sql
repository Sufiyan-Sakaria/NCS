/*
  Warnings:

  - Added the required column `invoiceId` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preBalance` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voucherId` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "invoiceId" TEXT NOT NULL,
ADD COLUMN     "preBalance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "voucherId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "JournalEntry_invoiceId_idx" ON "JournalEntry"("invoiceId");

-- CreateIndex
CREATE INDEX "JournalEntry_voucherId_idx" ON "JournalEntry"("voucherId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
