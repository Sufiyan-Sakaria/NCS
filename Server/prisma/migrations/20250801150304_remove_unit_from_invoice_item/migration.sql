/*
  Warnings:

  - You are about to drop the column `unitId` on the `InvoiceItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_unitId_fkey";

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "unitId";
