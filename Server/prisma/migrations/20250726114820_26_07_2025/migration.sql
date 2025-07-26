/*
  Warnings:

  - Added the required column `voucherLedgerId` to the `VoucherEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerType" ADD VALUE 'SalesReturns';
ALTER TYPE "LedgerType" ADD VALUE 'PurchaseReturns';

-- AlterTable
ALTER TABLE "VoucherEntry" ADD COLUMN     "voucherLedgerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_voucherLedgerId_fkey" FOREIGN KEY ("voucherLedgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
