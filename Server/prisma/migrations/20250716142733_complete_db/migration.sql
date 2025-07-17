/*
  Warnings:

  - You are about to drop the column `journalId` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `productLedgerId` on the `ProductLedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the `Journal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductLedger` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `journalBookId` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productBookId` to the `ProductLedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PURCHASE', 'SALE', 'PURCHASE_RETURN', 'SALE_RETURN');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- DropForeignKey
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_financialYearId_fkey";

-- DropForeignKey
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_journalId_fkey";

-- DropForeignKey
ALTER TABLE "ProductLedger" DROP CONSTRAINT "ProductLedger_branchId_fkey";

-- DropForeignKey
ALTER TABLE "ProductLedger" DROP CONSTRAINT "ProductLedger_financialYearId_fkey";

-- DropForeignKey
ALTER TABLE "ProductLedgerEntry" DROP CONSTRAINT "ProductLedgerEntry_productLedgerId_fkey";

-- DropIndex
DROP INDEX "JournalEntry_journalId_idx";

-- DropIndex
DROP INDEX "ProductLedgerEntry_productLedgerId_idx";

-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "journalId",
ADD COLUMN     "journalBookId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductLedgerEntry" DROP COLUMN "productLedgerId",
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "productBookId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Journal";

-- DropTable
DROP TABLE "ProductLedger";

-- CreateTable
CREATE TABLE "ProductBook" (
    "id" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalBook" (
    "id" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceBook" (
    "id" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "invoiceBookId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherBook" (
    "id" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "VoucherType" NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "VoucherType" NOT NULL,
    "voucherBookId" TEXT NOT NULL,
    "reference" TEXT,
    "narration" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherEntry" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBook_financialYearId_idx" ON "ProductBook"("financialYearId");

-- CreateIndex
CREATE INDEX "ProductBook_branchId_idx" ON "ProductBook"("branchId");

-- CreateIndex
CREATE INDEX "ProductBook_isActive_idx" ON "ProductBook"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBook_financialYearId_branchId_key" ON "ProductBook"("financialYearId", "branchId");

-- CreateIndex
CREATE INDEX "JournalBook_financialYearId_idx" ON "JournalBook"("financialYearId");

-- CreateIndex
CREATE INDEX "JournalBook_branchId_idx" ON "JournalBook"("branchId");

-- CreateIndex
CREATE INDEX "JournalBook_isActive_idx" ON "JournalBook"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "JournalBook_financialYearId_branchId_key" ON "JournalBook"("financialYearId", "branchId");

-- CreateIndex
CREATE INDEX "InvoiceBook_financialYearId_idx" ON "InvoiceBook"("financialYearId");

-- CreateIndex
CREATE INDEX "InvoiceBook_branchId_idx" ON "InvoiceBook"("branchId");

-- CreateIndex
CREATE INDEX "InvoiceBook_isActive_idx" ON "InvoiceBook"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBook_financialYearId_branchId_type_key" ON "InvoiceBook"("financialYearId", "branchId", "type");

-- CreateIndex
CREATE INDEX "Invoice_invoiceBookId_date_idx" ON "Invoice"("invoiceBookId", "date");

-- CreateIndex
CREATE INDEX "Invoice_ledgerId_isActive_idx" ON "Invoice"("ledgerId", "isActive");

-- CreateIndex
CREATE INDEX "Invoice_type_date_invoiceNumber_idx" ON "Invoice"("type", "date", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceBookId_invoiceNumber_key" ON "Invoice"("invoiceBookId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "InvoiceItem_isActive_idx" ON "InvoiceItem"("isActive");

-- CreateIndex
CREATE INDEX "VoucherBook_financialYearId_idx" ON "VoucherBook"("financialYearId");

-- CreateIndex
CREATE INDEX "VoucherBook_branchId_idx" ON "VoucherBook"("branchId");

-- CreateIndex
CREATE INDEX "VoucherBook_isActive_idx" ON "VoucherBook"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherBook_financialYearId_branchId_type_key" ON "VoucherBook"("financialYearId", "branchId", "type");

-- CreateIndex
CREATE INDEX "Voucher_voucherBookId_date_idx" ON "Voucher"("voucherBookId", "date");

-- CreateIndex
CREATE INDEX "Voucher_type_date_idx" ON "Voucher"("type", "date");

-- CreateIndex
CREATE INDEX "Voucher_invoiceId_idx" ON "Voucher"("invoiceId");

-- CreateIndex
CREATE INDEX "Voucher_isActive_idx" ON "Voucher"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_voucherBookId_voucherNumber_key" ON "Voucher"("voucherBookId", "voucherNumber");

-- CreateIndex
CREATE INDEX "VoucherEntry_voucherId_idx" ON "VoucherEntry"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherEntry_ledgerId_idx" ON "VoucherEntry"("ledgerId");

-- CreateIndex
CREATE INDEX "VoucherEntry_isActive_idx" ON "VoucherEntry"("isActive");

-- CreateIndex
CREATE INDEX "JournalEntry_journalBookId_idx" ON "JournalEntry"("journalBookId");

-- CreateIndex
CREATE INDEX "ProductLedgerEntry_productBookId_idx" ON "ProductLedgerEntry"("productBookId");

-- CreateIndex
CREATE INDEX "ProductLedgerEntry_invoiceId_idx" ON "ProductLedgerEntry"("invoiceId");

-- AddForeignKey
ALTER TABLE "ProductBook" ADD CONSTRAINT "ProductBook_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBook" ADD CONSTRAINT "ProductBook_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBook" ADD CONSTRAINT "ProductBook_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBook" ADD CONSTRAINT "ProductBook_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_productBookId_fkey" FOREIGN KEY ("productBookId") REFERENCES "ProductBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLedgerEntry" ADD CONSTRAINT "ProductLedgerEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalBook" ADD CONSTRAINT "JournalBook_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalBook" ADD CONSTRAINT "JournalBook_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalBook" ADD CONSTRAINT "JournalBook_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalBook" ADD CONSTRAINT "JournalBook_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_journalBookId_fkey" FOREIGN KEY ("journalBookId") REFERENCES "JournalBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBook" ADD CONSTRAINT "InvoiceBook_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBook" ADD CONSTRAINT "InvoiceBook_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBook" ADD CONSTRAINT "InvoiceBook_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBook" ADD CONSTRAINT "InvoiceBook_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_invoiceBookId_fkey" FOREIGN KEY ("invoiceBookId") REFERENCES "InvoiceBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherBook" ADD CONSTRAINT "VoucherBook_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherBook" ADD CONSTRAINT "VoucherBook_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherBook" ADD CONSTRAINT "VoucherBook_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherBook" ADD CONSTRAINT "VoucherBook_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_voucherBookId_fkey" FOREIGN KEY ("voucherBookId") REFERENCES "VoucherBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
