-- CreateEnum
CREATE TYPE "AccountGroupType" AS ENUM ('CapitalAccount', 'LoansLiabilities', 'CurrentLiabilities', 'FixedAssets', 'Investments', 'CurrentAssets', 'BranchDivisions', 'MiscExpensesAssets', 'SalesAccounts', 'PurchaseAccounts', 'DirectIncomes', 'IndirectIncomes', 'DirectExpenses', 'IndirectExpenses', 'SuspenseAccount', 'DutiesTaxes', 'Provisions', 'BankAccounts', 'CashInHand', 'Deposits', 'SecuredLoans', 'UnsecuredLoans', 'AccountsReceivable', 'AccountsPayable');

-- AlterEnum
ALTER TYPE "AccountGroupNature" ADD VALUE 'Drawings';

-- AlterTable
ALTER TABLE "AccountGroup" ADD COLUMN     "groupType" "AccountGroupType";

-- CreateIndex
CREATE INDEX "AccountGroup_groupType_idx" ON "AccountGroup"("groupType");
