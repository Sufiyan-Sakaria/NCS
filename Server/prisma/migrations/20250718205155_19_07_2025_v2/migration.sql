/*
  Warnings:

  - A unique constraint covering the columns `[name,brandId,branchId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_name_branchId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_brandId_branchId_key" ON "Product"("name", "brandId", "branchId");
