/*
  Warnings:

  - Made the column `godownId` on table `InvoiceItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_godownId_fkey";

-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "godownId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
