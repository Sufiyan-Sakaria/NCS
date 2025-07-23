/*
  Warnings:

  - Added the required column `rate` to the `ProductLedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "previousPurchaseRate" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductLedgerEntry" ADD COLUMN     "rate" DOUBLE PRECISION NOT NULL;
