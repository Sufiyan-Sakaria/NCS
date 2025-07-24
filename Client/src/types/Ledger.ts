import { AccountGroup } from "./AccountGroup";

export interface Ledger {
  id: string;
  name: string;
  code: string;
  type: string;
  phone1?: string;
  phone2?: string;
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
  | "GSTPayable"
  | "TDSPayable"
  | "AdvanceFromCustomers"
  | "OwnerCapital"
  | "RetainedEarnings"
  | "Drawings"
  | "Reserves"
  | "Sales"
  | "SalesReturns"
  | "InterestIncome"
  | "CommissionReceived"
  | "RentalIncome"
  | "OtherIncome"
  | "Purchase"
  | "PurchaseReturns"
  | "Wages"
  | "Rent"
  | "Electricity"
  | "Telephone"
  | "Transportation"
  | "RepairsAndMaintenance"
  | "Depreciation"
  | "MiscellaneousExpenses";
