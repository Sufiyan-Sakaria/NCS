-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "AccountGroup_isActive_idx" ON "AccountGroup"("isActive");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE INDEX "Godown_isActive_idx" ON "Godown"("isActive");

-- CreateIndex
CREATE INDEX "Journal_isActive_idx" ON "Journal"("isActive");

-- CreateIndex
CREATE INDEX "JournalEntry_isActive_idx" ON "JournalEntry"("isActive");

-- CreateIndex
CREATE INDEX "Ledger_isActive_idx" ON "Ledger"("isActive");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "ProductStock_isActive_idx" ON "ProductStock"("isActive");

-- CreateIndex
CREATE INDEX "Unit_isActive_idx" ON "Unit"("isActive");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "UserBranchAccess_isActive_idx" ON "UserBranchAccess"("isActive");
