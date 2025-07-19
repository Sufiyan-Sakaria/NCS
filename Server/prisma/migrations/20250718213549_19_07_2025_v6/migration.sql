-- AlterTable
ALTER TABLE "GodownTransfer" ADD COLUMN     "productBookId" TEXT;

-- CreateIndex
CREATE INDEX "GodownTransfer_productBookId_idx" ON "GodownTransfer"("productBookId");

-- AddForeignKey
ALTER TABLE "GodownTransfer" ADD CONSTRAINT "GodownTransfer_productBookId_fkey" FOREIGN KEY ("productBookId") REFERENCES "ProductBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
