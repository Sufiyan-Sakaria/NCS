-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Voucher" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VoucherBook" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VoucherEntry" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "GodownTransfer" (
    "id" TEXT NOT NULL,
    "fromGodownId" TEXT NOT NULL,
    "toGodownId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "GodownTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GodownTransfer_fromGodownId_idx" ON "GodownTransfer"("fromGodownId");

-- CreateIndex
CREATE INDEX "GodownTransfer_toGodownId_idx" ON "GodownTransfer"("toGodownId");

-- CreateIndex
CREATE INDEX "GodownTransfer_productId_idx" ON "GodownTransfer"("productId");

-- AddForeignKey
ALTER TABLE "GodownTransfer" ADD CONSTRAINT "GodownTransfer_fromGodownId_fkey" FOREIGN KEY ("fromGodownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GodownTransfer" ADD CONSTRAINT "GodownTransfer_toGodownId_fkey" FOREIGN KEY ("toGodownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GodownTransfer" ADD CONSTRAINT "GodownTransfer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
