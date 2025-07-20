/*
  Warnings:

  - You are about to drop the column `taxRate` on the `InvoiceItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "taxRate",
ADD COLUMN     "cartage" DOUBLE PRECISION NOT NULL DEFAULT 0;
