/*
  Warnings:

  - The values [Inventory,GSTPayable,TDSPayable] on the enum `LedgerType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LedgerType_new" AS ENUM ('GSTInput', 'GSTOutput', 'Cash', 'Bank', 'AccountsReceivable', 'FixedAssets', 'PrepaidExpenses', 'AdvanceToSuppliers', 'AccountsPayable', 'AccruedExpenses', 'LoansPayable', 'AdvanceFromCustomers', 'OwnerCapital', 'RetainedEarnings', 'Drawings', 'Reserves', 'Sales', 'SalesReturns', 'InterestIncome', 'CommissionReceived', 'RentalIncome', 'OtherIncome', 'Purchase', 'PurchaseReturns', 'SalesDiscount', 'PurchaseDiscount', 'Wages', 'Rent', 'Electricity', 'Telephone', 'Transportation', 'RepairsAndMaintenance', 'Depreciation', 'MiscellaneousExpenses');
ALTER TABLE "Ledger" ALTER COLUMN "type" TYPE "LedgerType_new" USING ("type"::text::"LedgerType_new");
ALTER TYPE "LedgerType" RENAME TO "LedgerType_old";
ALTER TYPE "LedgerType_new" RENAME TO "LedgerType";
DROP TYPE "LedgerType_old";
COMMIT;
