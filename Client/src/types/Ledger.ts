import { AccountGroup } from "./AccountGroup";

export interface Ledger {
  id: string;
  name: string;
  code: string;
  type: string;
  phone1?: string;
  phone2?: string;
  address?: string;
  balance: number;
  openingBalance: number;
  accountGroupId: string;
  accountGroup?: AccountGroup;
  branchId: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerType =
  | "GSTInput"
  | "GSTOutput"
  | "Cash"
  | "Bank"
  | "AccountsReceivable"
  | "Inventory"
  | "FixedAssets"
  | "PrepaidExpenses"
  | "AdvanceToSuppliers"
  | "AccountsPayable"
  | "AccruedExpenses"
  | "LoansPayable"
  | "AdvanceFromCustomers"
  | "OwnerCapital"
  | "RetainedEarnings"
  | "Drawings"
  | "Reserves"
  | "Sales"
  | "SalesReturns"
  | "SalesDiscount"
  | "InterestIncome"
  | "CommissionReceived"
  | "RentalIncome"
  | "OtherIncome"
  | "Purchase"
  | "PurchaseReturns"
  | "PurchaseDiscounts"
  | "Wages"
  | "Rent"
  | "Electricity"
  | "Telephone"
  | "Transportation"
  | "RepairsAndMaintenance"
  | "Depreciation"
  | "MiscellaneousExpenses";
