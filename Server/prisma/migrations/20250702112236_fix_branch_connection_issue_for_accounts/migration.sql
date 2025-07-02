/*
  Warnings:

  - A unique constraint covering the columns `[name,parentId,branchId]` on the table `AccountGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,branchId]` on the table `Ledger` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `AccountGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `Ledger` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AccountGroup_name_parentId_key";

-- DropIndex
DROP INDEX "Ledger_name_key";

-- AlterTable
ALTER TABLE "AccountGroup" ADD COLUMN     "branchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "branchId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AccountGroup_branchId_idx" ON "AccountGroup"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_name_parentId_branchId_key" ON "AccountGroup"("name", "parentId", "branchId");

-- CreateIndex
CREATE INDEX "Ledger_branchId_idx" ON "Ledger"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_name_branchId_key" ON "Ledger"("name", "branchId");

-- AddForeignKey
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
