/*
  Warnings:

  - Added the required column `finalQty` to the `ProductLedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finalThaan` to the `ProductLedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousQty` to the `ProductLedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousThaan` to the `ProductLedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductLedgerEntry" ADD COLUMN     "finalQty" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "finalThaan" INTEGER NOT NULL,
ADD COLUMN     "previousQty" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "previousThaan" INTEGER NOT NULL;
