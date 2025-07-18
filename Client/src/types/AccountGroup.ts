import { Ledger } from "./Ledger";

export type Nature = "Assets" | "Liabilities" | "Capital" | "Income" | "Expenses";

export type AccountGroupType =
  | "CapitalAccount"
  | "LoansLiabilities"
  | "CurrentLiabilities"
  | "FixedAssets"
  | "Investments"
  | "CurrentAssets"
  | "BranchDivisions"
  | "MiscExpensesAssets"
  | "SalesAccounts"
  | "PurchaseAccounts"
  | "DirectIncomes"
  | "IndirectIncomes"
  | "DirectExpenses"
  | "IndirectExpenses"
  | "SuspenseAccount"
  | "DutiesTaxes"
  | "Provisions"
  | "BankAccounts"
  | "CashInHand"
  | "Deposits"
  | "SecuredLoans"
  | "UnsecuredLoans"
  | "AccountsReceivable"
  | "AccountsPayable";

export const natureOptions = ["Assets", "Liabilities", "Capital", "Income", "Expenses"] as const;
export type NatureArray = (typeof natureOptions)[number];

export const accountGroupTypeOptions = [
  "CapitalAccount",
  "LoansLiabilities",
  "CurrentLiabilities",
  "FixedAssets",
  "Investments",
  "CurrentAssets",
  "BranchDivisions",
  "MiscExpensesAssets",
  "SalesAccounts",
  "PurchaseAccounts",
  "DirectIncomes",
  "IndirectIncomes",
  "DirectExpenses",
  "IndirectExpenses",
  "SuspenseAccount",
  "DutiesTaxes",
  "Provisions",
  "BankAccounts",
  "CashInHand",
  "Deposits",
  "SecuredLoans",
  "UnsecuredLoans",
  "AccountsReceivable",
  "AccountsPayable",
] as const;
export type AccountGroupTypeArray = (typeof accountGroupTypeOptions)[number];

export interface AccountGroup {
  id: string;
  name: string;
  code: string;
  nature: Nature;
  type: AccountGroupType;
  parentId?: string | null;
  branchId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  children: AccountGroup[];
  ledgers: Ledger[];
}

export interface EditableAccountGroup {
  id: string;
  name: string;
  code: string;
  nature: Nature;
  type?: AccountGroupType | null;
  parentId?: string | null;
  branchId: string;
}
