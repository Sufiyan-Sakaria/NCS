-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'admin', 'manager', 'viewer');

-- CreateEnum
CREATE TYPE "AccountGroupNature" AS ENUM ('Assets', 'Liabilities', 'Capital', 'Expenses', 'Income');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('Cash', 'Bank', 'AccountsReceivable', 'Inventory', 'FixedAssets', 'PrepaidExpenses', 'AdvanceToSuppliers', 'AccountsPayable', 'AccruedExpenses', 'LoansPayable', 'GSTPayable', 'TDSPayable', 'AdvanceFromCustomers', 'OwnerCapital', 'RetainedEarnings', 'Drawings', 'Reserves', 'Sales', 'InterestIncome', 'CommissionReceived', 'RentalIncome', 'OtherIncome', 'Purchase', 'Wages', 'Rent', 'Electricity', 'Telephone', 'Transportation', 'RepairsAndMaintenance', 'Depreciation', 'MiscellaneousExpenses');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranchAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBranchAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abb" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abb" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abb" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hsn" SERIAL NOT NULL,
    "unitId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "saleRate" DOUBLE PRECISION NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thaan" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Godown" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Godown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "godownId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thaan" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nature" "AccountGroupNature" NOT NULL,
    "parentId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLedger" (
    "id" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLedgerEntry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productLedgerId" TEXT NOT NULL,
    "godownId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "thaan" INTEGER NOT NULL,
    "narration" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "phone1" TEXT NOT NULL,
    "phone2" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "openingBalance" DECIMAL(65,30) NOT NULL,
    "accountGroupId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "narration" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdBy_idx" ON "User"("createdBy");

-- CreateIndex
CREATE INDEX "User_updatedBy_idx" ON "User"("updatedBy");

-- CreateIndex
CREATE INDEX "UserBranchAccess_createdBy_idx" ON "UserBranchAccess"("createdBy");

-- CreateIndex
CREATE INDEX "UserBranchAccess_updatedBy_idx" ON "UserBranchAccess"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "UserBranchAccess_userId_branchId_key" ON "UserBranchAccess"("userId", "branchId");

-- CreateIndex
CREATE INDEX "Brand_branchId_idx" ON "Brand"("branchId");

-- CreateIndex
CREATE INDEX "Brand_createdBy_idx" ON "Brand"("createdBy");

-- CreateIndex
CREATE INDEX "Brand_updatedBy_idx" ON "Brand"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_branchId_key" ON "Brand"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_abb_branchId_key" ON "Brand"("abb", "branchId");

-- CreateIndex
CREATE INDEX "Category_branchId_idx" ON "Category"("branchId");

-- CreateIndex
CREATE INDEX "Category_createdBy_idx" ON "Category"("createdBy");

-- CreateIndex
CREATE INDEX "Category_updatedBy_idx" ON "Category"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_branchId_key" ON "Category"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_abb_branchId_key" ON "Category"("abb", "branchId");

-- CreateIndex
CREATE INDEX "Unit_branchId_idx" ON "Unit"("branchId");

-- CreateIndex
CREATE INDEX "Unit_createdBy_idx" ON "Unit"("createdBy");

-- CreateIndex
CREATE INDEX "Unit_updatedBy_idx" ON "Unit"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_branchId_key" ON "Unit"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_abb_branchId_key" ON "Unit"("abb", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_branchId_key" ON "Product"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Godown_name_key" ON "Godown"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Godown_address_key" ON "Godown"("address");

-- CreateIndex
CREATE INDEX "Godown_branchId_idx" ON "Godown"("branchId");

-- CreateIndex
CREATE INDEX "Godown_createdBy_idx" ON "Godown"("createdBy");

-- CreateIndex
CREATE INDEX "Godown_updatedBy_idx" ON "Godown"("updatedBy");

-- CreateIndex
CREATE INDEX "ProductStock_productId_idx" ON "ProductStock"("productId");

-- CreateIndex
CREATE INDEX "ProductStock_godownId_idx" ON "ProductStock"("godownId");

-- CreateIndex
CREATE INDEX "ProductStock_unitId_idx" ON "ProductStock"("unitId");

-- CreateIndex
CREATE INDEX "ProductStock_createdBy_idx" ON "ProductStock"("createdBy");

-- CreateIndex
CREATE INDEX "ProductStock_updatedBy_idx" ON "ProductStock"("updatedBy");

-- CreateIndex
CREATE INDEX "AccountGroup_parentId_idx" ON "AccountGroup"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_name_parentId_key" ON "AccountGroup"("name", "parentId");

-- CreateIndex
CREATE INDEX "ProductLedger_financialYearId_idx" ON "ProductLedger"("financialYearId");

-- CreateIndex
CREATE INDEX "ProductLedger_branchId_idx" ON "ProductLedger"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLedger_financialYearId_branchId_key" ON "ProductLedger"("financialYearId", "branchId");

-- CreateIndex
CREATE INDEX "ProductLedgerEntry_productId_idx" ON "ProductLedgerEntry"("productId");

-- CreateIndex
CREATE INDEX "ProductLedgerEntry_productLedgerId_idx" ON "ProductLedgerEntry"("productLedgerId");

-- CreateIndex
CREATE INDEX "ProductLedgerEntry_godownId_idx" ON "ProductLedgerEntry"("godownId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_name_key" ON "Ledger"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_code_key" ON "Ledger"("code");

-- CreateIndex
CREATE INDEX "Ledger_accountGroupId_idx" ON "Ledger"("accountGroupId");

-- CreateIndex
CREATE INDEX "Journal_financialYearId_idx" ON "Journal"("financialYearId");

-- CreateIndex
CREATE INDEX "Journal_branchId_idx" ON "Journal"("branchId");

-- CreateIndex
CREATE INDEX "JournalEntry_journalId_idx" ON "JournalEntry"("journalId");

-- CreateIndex
CREATE INDEX "JournalEntry_ledgerId_idx" ON "JournalEntry"("ledgerId");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "FinancialYear_companyId_idx" ON "FinancialYear"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Godown" ADD CONSTRAINT "Godown_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AccountGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedger" ADD CONSTRAINT "ProductLedger_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedger" ADD CONSTRAINT "ProductLedger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_productLedgerId_fkey" FOREIGN KEY ("productLedgerId") REFERENCES "ProductLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_accountGroupId_fkey" FOREIGN KEY ("accountGroupId") REFERENCES "AccountGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
