/*
  Warnings:

  - You are about to drop the column `taxAmount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `cartage` on the `InvoiceItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "taxAmount",
ADD COLUMN     "cartage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "cartage",
ADD COLUMN     "godownId" TEXT,
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "thaan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitId" TEXT;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
